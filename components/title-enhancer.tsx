"use client"

import { useState } from "react"
import { Search, Sparkles, Youtube, ArrowRight, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { VideoCard } from "@/components/video-card"
import { AuthTokenInput } from "@/components/auth-token-input"

interface Video {
  id: string
  title: string
  thumbnail: string
  publishedAt: string
  viewCount: string
  enhancedTitle?: string
  reason?: string
  isEnhancing?: boolean
}

interface ChannelInfo {
  id: string
  title: string
  thumbnail: string
  subscriberCount: string
  videoCount: string
}

export function TitleEnhancer() {
  const [channelUrl, setChannelUrl] = useState("")
  const [youtubeApiKey, setYoutubeApiKey] = useState("")
  const [puterAuthToken, setPuterAuthToken] = useState("")
  const [channelInfo, setChannelInfo] = useState<ChannelInfo | null>(null)
  const [videos, setVideos] = useState<Video[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const extractChannelId = (url: string): string | null => {
    // Handle various YouTube URL formats
    const patterns = [
      /youtube\.com\/channel\/([a-zA-Z0-9_-]+)/,
      /youtube\.com\/@([a-zA-Z0-9_-]+)/,
      /youtube\.com\/c\/([a-zA-Z0-9_-]+)/,
      /youtube\.com\/user\/([a-zA-Z0-9_-]+)/,
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) return match[1]
    }

    // If it's just a channel ID or handle
    if (url.startsWith("@") || url.match(/^UC[a-zA-Z0-9_-]{22}$/)) {
      return url
    }

    return url.trim()
  }

  const fetchChannel = async () => {
    if (!channelUrl.trim()) {
      setError("Please enter a YouTube channel URL or ID")
      return
    }

    if (!youtubeApiKey.trim()) {
      setError("Please enter your YouTube API key")
      return
    }

    setIsLoading(true)
    setError("")
    setChannelInfo(null)
    setVideos([])

    try {
      const channelIdentifier = extractChannelId(channelUrl)

      // Determine if it's a channel ID or handle
      let channelId = channelIdentifier

      if (channelIdentifier?.startsWith("@")) {
        // Search for the channel by handle
        const searchResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(channelIdentifier)}&type=channel&key=${youtubeApiKey}`,
        )
        const searchData = await searchResponse.json()

        if (searchData.error) {
          throw new Error(searchData.error.message)
        }

        if (searchData.items && searchData.items.length > 0) {
          channelId = searchData.items[0].id.channelId
        } else {
          throw new Error("Channel not found")
        }
      } else if (!channelIdentifier?.startsWith("UC")) {
        // Search for the channel by name
        const searchResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(channelIdentifier || "")}&type=channel&key=${youtubeApiKey}`,
        )
        const searchData = await searchResponse.json()

        if (searchData.error) {
          throw new Error(searchData.error.message)
        }

        if (searchData.items && searchData.items.length > 0) {
          channelId = searchData.items[0].id.channelId
        } else {
          throw new Error("Channel not found")
        }
      }

      // Fetch channel details
      const channelResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${youtubeApiKey}`,
      )
      const channelData = await channelResponse.json()

      if (channelData.error) {
        throw new Error(channelData.error.message)
      }

      if (!channelData.items || channelData.items.length === 0) {
        throw new Error("Channel not found")
      }

      const channel = channelData.items[0]
      setChannelInfo({
        id: channel.id,
        title: channel.snippet.title,
        thumbnail: channel.snippet.thumbnails.medium.url,
        subscriberCount: formatNumber(channel.statistics.subscriberCount),
        videoCount: formatNumber(channel.statistics.videoCount),
      })

      // Fetch channel videos
      const videosResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&order=date&type=video&maxResults=10&key=${youtubeApiKey}`,
      )
      const videosData = await videosResponse.json()

      if (videosData.error) {
        throw new Error(videosData.error.message)
      }

      if (videosData.items && videosData.items.length > 0) {
        const videoIds = videosData.items.map((item: { id: { videoId: string } }) => item.id.videoId).join(",")

        // Fetch video statistics
        const statsResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds}&key=${youtubeApiKey}`,
        )
        const statsData = await statsResponse.json()

        const videosWithStats = videosData.items.map(
          (
            item: {
              id: { videoId: string }
              snippet: { title: string; thumbnails: { medium: { url: string } }; publishedAt: string }
            },
            index: number,
          ) => ({
            id: item.id.videoId,
            title: item.snippet.title,
            thumbnail: item.snippet.thumbnails.medium.url,
            publishedAt: new Date(item.snippet.publishedAt).toLocaleDateString(),
            viewCount: formatNumber(statsData.items?.[index]?.statistics?.viewCount || "0"),
          }),
        )

        setVideos(videosWithStats)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch channel data")
    } finally {
      setIsLoading(false)
    }
  }

  const enhanceTitle = async (videoId: string, originalTitle: string) => {
    if (!puterAuthToken.trim()) {
      setError("Please enter your Puter auth token to enhance titles")
      return
    }

    setVideos((prev) => prev.map((v) => (v.id === videoId ? { ...v, isEnhancing: true } : v)))

    try {
      const response = await fetch("https://api.puter.com/drivers/call", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${puterAuthToken}`,
        },
        body: JSON.stringify({
          interface: "puter-chat-completion",
          driver: "openai-completion",
          test_mode: false,
          method: "complete",
          args: {
            messages: [
              {
                role: "system",
                content: `You are a YouTube title optimization expert. Your task is to enhance video titles to improve click-through rates while maintaining accuracy and avoiding clickbait. Always respond in JSON format with two fields: "enhancedTitle" (the improved title) and "reason" (a brief explanation of why this title is better).`,
              },
              {
                role: "user",
                content: `Enhance this YouTube video title for better engagement and click-through rate. Keep it under 60 characters if possible.

Original title: "${originalTitle}"

Respond in this exact JSON format:
{
  "enhancedTitle": "Your enhanced title here",
  "reason": "Brief explanation of improvements"
}`,
              },
            ],
            model: "gpt-4o-mini",
            stream: false,
          },
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to enhance title")
      }

      const data = await response.json()
      const content = data.result?.message?.content || data.message?.content

      if (!content) {
        throw new Error("No response from AI")
      }

      // Parse the JSON response
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error("Invalid response format")
      }

      const parsed = JSON.parse(jsonMatch[0])

      setVideos((prev) =>
        prev.map((v) =>
          v.id === videoId
            ? {
                ...v,
                enhancedTitle: parsed.enhancedTitle,
                reason: parsed.reason,
                isEnhancing: false,
              }
            : v,
        ),
      )
    } catch (err) {
      console.error("Enhancement error:", err)
      setVideos((prev) => prev.map((v) => (v.id === videoId ? { ...v, isEnhancing: false } : v)))
      setError(err instanceof Error ? err.message : "Failed to enhance title")
    }
  }

  const enhanceAllTitles = async () => {
    for (const video of videos) {
      if (!video.enhancedTitle) {
        await enhanceTitle(video.id, video.title)
        // Small delay between requests to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
    }
  }

  const formatNumber = (num: string): string => {
    const n = Number.parseInt(num)
    if (n >= 1000000) return (n / 1000000).toFixed(1) + "M"
    if (n >= 1000) return (n / 1000).toFixed(1) + "K"
    return num
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
            <Youtube className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">YouTube Title Enhancer</h1>
        </div>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Boost your video click-through rates with AI-powered title optimization. Get engaging titles that attract more
          viewers.
        </p>
      </div>

      {/* API Keys Section */}
      <Card className="mb-8 border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            API Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <AuthTokenInput
              label="YouTube API Key"
              value={youtubeApiKey}
              onChange={setYoutubeApiKey}
              placeholder="Enter your YouTube Data API key"
            />
            <AuthTokenInput
              label="Puter Auth Token"
              value={puterAuthToken}
              onChange={setPuterAuthToken}
              placeholder="Enter your Puter authentication token"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Your API keys are stored locally and never sent to our servers.
          </p>
        </CardContent>
      </Card>

      {/* Search Section */}
      <Card className="mb-8 border-border bg-card">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Enter YouTube channel URL, handle (@channel), or channel ID"
                value={channelUrl}
                onChange={(e) => setChannelUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchChannel()}
                className="pl-10 h-12 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <Button
              onClick={fetchChannel}
              disabled={isLoading}
              className="h-12 px-6 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <span>Fetch Channel</span>
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Card className="mb-8 border-destructive/50 bg-destructive/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-destructive">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Channel Info */}
      {channelInfo && (
        <Card className="mb-8 border-border bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <img
                src={channelInfo.thumbnail || "/placeholder.svg"}
                alt={channelInfo.title}
                className="h-16 w-16 rounded-full border-2 border-border"
              />
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-foreground">{channelInfo.title}</h2>
                <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                  <span>{channelInfo.subscriberCount} subscribers</span>
                  <span>{channelInfo.videoCount} videos</span>
                </div>
              </div>
              <Button
                onClick={enhanceAllTitles}
                disabled={!puterAuthToken || videos.every((v) => v.enhancedTitle)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Enhance All Titles
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Videos Grid */}
      {videos.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Latest Videos ({videos.length})
          </h3>
          <div className="grid gap-4">
            {videos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                onEnhance={() => enhanceTitle(video.id, video.title)}
                hasToken={!!puterAuthToken}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !channelInfo && !error && (
        <Card className="border-dashed border-2 border-border bg-card/50">
          <CardContent className="py-16 text-center">
            <Youtube className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-medium text-foreground mb-2">No Channel Loaded</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Enter a YouTube channel URL above to fetch videos and enhance their titles with AI-powered suggestions.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
