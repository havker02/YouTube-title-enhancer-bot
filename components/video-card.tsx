"use client"

import { Sparkles, Loader2, ExternalLink, Copy, Check, Lightbulb } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useState } from "react"

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

interface VideoCardProps {
  video: Video
  onEnhance: () => void
  hasToken: boolean
}

export function VideoCard({ video, onEnhance, hasToken }: VideoCardProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="border-border bg-card overflow-hidden hover:border-primary/30 transition-colors">
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row">
          {/* Thumbnail */}
          <div className="relative md:w-64 flex-shrink-0">
            <a
              href={`https://youtube.com/watch?v=${video.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <img
                src={video.thumbnail || "/placeholder.svg"}
                alt={video.title}
                className="w-full h-36 md:h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center">
                <ExternalLink className="h-8 w-8 text-white opacity-0 hover:opacity-100 transition-opacity" />
              </div>
            </a>
          </div>

          {/* Content */}
          <div className="flex-1 p-4 space-y-3">
            {/* Original Title */}
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Original Title</p>
              <h4 className="font-medium text-foreground leading-snug">{video.title}</h4>
            </div>

            {/* Enhanced Title */}
            {video.enhancedTitle && (
              <div className="pt-2 border-t border-border">
                <p className="text-xs uppercase tracking-wider text-primary mb-1 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Enhanced Title
                </p>
                <div className="flex items-start gap-2">
                  <h4 className="font-medium text-foreground leading-snug flex-1">{video.enhancedTitle}</h4>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-foreground"
                    onClick={() => copyToClipboard(video.enhancedTitle!)}
                  >
                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}

            {/* Reason */}
            {video.reason && (
              <div className="bg-secondary/50 rounded-lg p-3 border border-border">
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
                  <Lightbulb className="h-3 w-3" />
                  Why This Title is Better
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">{video.reason}</p>
              </div>
            )}

            {/* Meta & Actions */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex gap-3 text-xs text-muted-foreground">
                <span>{video.viewCount} views</span>
                <span>•</span>
                <span>{video.publishedAt}</span>
              </div>

              {!video.enhancedTitle && (
                <Button
                  size="sm"
                  onClick={onEnhance}
                  disabled={video.isEnhancing || !hasToken}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {video.isEnhancing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enhancing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Enhance Title
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
