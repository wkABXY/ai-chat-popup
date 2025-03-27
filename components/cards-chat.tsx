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

export function CardsChat() {
  const [open, setOpen] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const [selectedModel, setSelectedModel] = useState('chatgpt-4o')
  const [messages, setMessages] = useState([
    {
      role: 'agent',
      content: 'Hi, how can I help you today?'
    },
    {
      role: 'user',
      content: "Hey, I'm having trouble with my account."
    }
  ])
  const [input, setInput] = useState('')
  const inputLength = input.trim().length

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight
    }
  }, [messages]) // 只在组件加

  const models = ['chatgpt-4o', 'gpt-3.5-turbo', 'gpt-4-turbo'] // 可扩展更多模型

  // 清空消息
  const clearMessages = () => {
    setMessages([])
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
        <Card className="w-120 transition-all duration-300">
          <CardHeader className="flex flex-row items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center space-x-4 p-2 rounded-md hover:bg-muted">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src="/favicon.png" alt="Image" />
                    <AvatarFallback className="rounded-md">dc</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      DiapatchTool Chat
                    </span>
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
            </div>
          </CardContent>
          <CardFooter>
            <form
              onSubmit={(event) => {
                event.preventDefault()
                if (inputLength === 0) return
                setMessages([
                  ...messages,
                  {
                    role: 'user',
                    content: input
                  }
                ])
                setInput('')
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
                      className="ml-auto"
                      onClick={clearMessages}
                    >
                      <Eraser />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent sideOffset={10}>
                    {`清除消息(新建会话)`}
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
              />

              <Button type="submit" size="icon" disabled={inputLength === 0}>
                <Send />
              </Button>
            </form>
          </CardFooter>
        </Card>
      </div>
    </>
  )
}
