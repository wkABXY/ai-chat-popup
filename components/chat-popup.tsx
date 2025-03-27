'use client'

import {useState, useEffect, useRef} from 'react'
import {Eraser, Bot, X, Send, MoreVerticalIcon} from 'lucide-react'
import {cn} from '@/lib/utils'
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar'
import {Button} from '@/components/ui/button'
import {Card, CardContent, CardFooter, CardHeader} from '@/components/ui/card'
import {Input} from '@/components/ui/input'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuRadioItem
} from '@/components/ui/dropdown-menu'

export default function ChatPopup() {
  const [open, setOpen] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const [selectedModel, setSelectedModel] = useState('gpt-3.5-turbo')
  const [messages, setMessages] = useState([
    {role: 'assistant', content: '欢迎使用 DispatchChat,您想了解什么?'}
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
   const [error, setError] = useState<string | null>(null)
  const inputLength = input.trim().length

  // 滚动到底部
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight
    }
  }, [messages, streamingContent])

  const models = ['gpt-3.5-turbo', 'gpt-4o', 'gpt-4-turbo']

  // 清空消息并重置会话
  const clearMessages = () => {
    setMessages([
      {role: 'assistant', content: '欢迎使用 DispatchChat,您想了解什么?'}
    ])
    setStreamingContent('')
  }

  // 发送消息并处理流式响应// 发送消息并处理流式响应
  const sendMessage = async (userMessage: string) => {
    if (!userMessage) return

    const updatedMessages = [...messages, {role: 'user', content: userMessage}]
    setMessages(updatedMessages)
    setInput('')
    setIsLoading(true)
    setStreamingContent('')
    setError(null)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          model: selectedModel,
          messages: updatedMessages
        })
      })

      // 改进的错误处理
      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = `API请求失败: ${response.status}`

        // 尝试将错误文本解析为JSON
        try {
          const errorJson = JSON.parse(errorText)
          if (errorJson && errorJson.error) {
            errorMessage += ` - ${errorJson.error}`
          }
        } catch (e) {
          // 如果不是JSON，直接使用文本
          errorMessage += ` - ${errorText || '未知错误'}`
        }

        throw new Error(errorMessage)
      }

      if (!response.body) throw new Error('API 响应体为空')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let accumulatedContent = ''

      while (true) {
        const {done, value} = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, {stream: true})

        // 检查是否是错误消息
        if (chunk.startsWith('Error:')) {
          throw new Error(chunk)
        }

        accumulatedContent += chunk
        setStreamingContent(accumulatedContent)
      }

      setMessages([
        ...updatedMessages,
        {role: 'assistant', content: accumulatedContent}
      ])
      setStreamingContent('')
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      setError(errorMessage)
      setMessages([
        ...updatedMessages,
        {role: 'assistant', content: `抱歉，发生了错误，请稍后再试。`}
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Button
        size="icon"
        variant="outline"
        className="ml-auto"
        onClick={() => setOpen(true)}
      >
        <Bot />
      </Button>
      <div
        className={cn(
          'fixed bottom-4 right-4 z-50',
          open
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-4 pointer-events-none'
        )}
      >
        <Card className="w-[480px] transition-all duration-300">
          <CardHeader className="flex flex-row items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center space-x-4 p-2 rounded-md hover:bg-muted cursor-pointer">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src="/favicon.png" alt="Image" />
                    <AvatarFallback className="rounded-md">DC</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">DiapatchChat</span>
                    <span className="truncate text-xs">{selectedModel}</span>
                  </div>
                  <MoreVerticalIcon className="ml-auto size-4" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>切换模型</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup
                  value={selectedModel}
                  onValueChange={setSelectedModel}
                >
                  {models.map((model) => (
                    <DropdownMenuRadioItem key={model} value={model}>
                      {model}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="ml-auto"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              <X />
            </Button>
          </CardHeader>
          <CardContent
            ref={contentRef}
            className="max-h-80 h-80 overflow-y-auto"
          >
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    'flex w-max max-w-[75%] flex-col gap-2 rounded-lg px-3 py-2 text-sm',
                    message.role === 'user'
                      ? 'ml-auto bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  {message.content}
                </div>
              ))}
              {streamingContent && (
                <div className="flex w-max max-w-[75%] flex-col gap-2 rounded-lg px-3 py-2 text-sm bg-muted">
                  {streamingContent}
                </div>
              )}
              {isLoading && !streamingContent && (
                <div className="flex w-max max-w-[75%] flex-col gap-2 rounded-lg px-3 py-2 text-sm bg-muted">
                  <div className="flex space-x-1">
                    <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"></div>
                    <div
                      className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"
                      style={{animationDelay: '0.2s'}}
                    ></div>
                    <div
                      className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"
                      style={{animationDelay: '0.4s'}}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <form
              onSubmit={(event) => {
                event.preventDefault()
                sendMessage(input)
              }}
              className="flex w-full items-center space-x-2"
            >
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={clearMessages}
                      disabled={isLoading}
                    >
                      <Eraser />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent sideOffset={10}>
                    清除消息(新建会话)
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Input
                id="message"
                placeholder="在这里输入消息..."
                className="flex-1"
                autoComplete="off"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                disabled={isLoading}
              />
              <Button
                type="submit"
                size="icon"
                disabled={inputLength === 0 || isLoading}
              >
                <Send />
              </Button>
            </form>
          </CardFooter>
        </Card>
      </div>
    </>
  )
}
