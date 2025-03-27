import { NextResponse } from "next/server"

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

export async function POST(req: Request) {
    try {
        // 检查环境变量
        const apiUrl = process.env.OPENAI_API_URL
        const apiKey = process.env.OPENAI_API_KEY
        if (!apiKey) {
            console.error("Missing OPENAI_API_KEY environment variable")
            return NextResponse.json(
                {
                    error: "API key is not configured",
                },
                { status: 500 },
            )
        }

        // 解析请求体
        let body
        try {
            body = await req.json()
        } catch (error) {
            console.error("Failed to parse request body:", error)
            return NextResponse.json(
                {
                    error: "Invalid request body",
                },
                { status: 400 },
            )
        }

        const { messages, model = "gpt-3.5-turbo" } = body

        // 验证消息格式
        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            console.error("Invalid messages format:", messages)
            return NextResponse.json(
                {
                    error: "Invalid messages format",
                },
                { status: 400 },
            )
        }

        // 确保消息格式正确
        const formattedMessages = messages.map((msg: any) => ({
            role: msg.role,
            content: msg.content,
        }))

        // 创建响应流
        const encoder = new TextEncoder()
        const stream = new TransformStream()
        const writer = stream.writable.getWriter()

            // 在后台处理 API 请求
            ; (async () => {
                try {
                    // 直接使用 fetch 调用 API，避免使用 OpenAI 客户端
                    if (!apiUrl) {
                        throw new Error("API URL is not configured");
                    }
                    const response = await fetch(apiUrl, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${apiKey}`,
                        },
                        body: JSON.stringify({
                            model: model,
                            messages: formattedMessages,
                            stream: true,
                        }),
                    })

                    if (!response.ok) {
                        const errorText = await response.text()
                        console.error(`API request failed: ${response.status}`, errorText)
                        await writer.write(encoder.encode(`Error: ${response.status} - ${errorText}`))
                        await writer.close()
                        return
                    }

                    const reader = response.body?.getReader()
                    if (!reader) {
                        console.error("No reader available from API response")
                        await writer.write(encoder.encode("Error: No response stream available"))
                        await writer.close()
                        return
                    }

                    const decoder = new TextDecoder()

                    // 处理 SSE 格式的响应
                    let buffer = ""

                    while (true) {
                        const { done, value } = await reader.read()
                        if (done) break

                        buffer += decoder.decode(value, { stream: true })

                        // 处理缓冲区中的每一行
                        const lines = buffer.split("\n")
                        buffer = lines.pop() || "" // 保留最后一个不完整的行

                        for (const line of lines) {
                            const trimmedLine = line.trim()
                            if (!trimmedLine || trimmedLine === "data: [DONE]") continue

                            if (trimmedLine.startsWith("data: ")) {
                                try {
                                    const data = JSON.parse(trimmedLine.slice(6))
                                    const content = data.choices[0]?.delta?.content || ""
                                    if (content) {
                                        await writer.write(encoder.encode(content))
                                    }
                                } catch (e) {
                                    console.error("Failed to parse SSE data:", trimmedLine, e)
                                }
                            }
                        }
                    }
                } catch (error) {
                    console.error("Error in streaming process:", error)
                    await writer.write(encoder.encode(`Error occurred: ${error instanceof Error ? error.message : String(error)}`))
                } finally {
                    await writer.close()
                }
            })()

        // 返回流式响应
        return new Response(stream.readable, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "Cache-Control": "no-cache",
                Connection: "keep-alive",
            },
        })
    } catch (error: any) {
        console.error("Chat API error:", error)

        // 确保始终返回 JSON 格式的错误响应
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : "An unknown error occurred",
            },
            { status: 500 },
        )
    }
}

