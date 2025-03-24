import { useState, useEffect } from 'react';
import { ExternalLink, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const MediaUrlPreview = ({ url, type, title }) => {
  const [previewValid, setPreviewValid] = useState(false);
  const [previewComponent, setPreviewComponent] =
    useState<React.ReactNode>(null);

  // Function to check if URL is a YouTube URL and extract the video ID
  const getYoutubeId = url => {
    const regExp =
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const match = url.match(regExp);
    return match ? match[1] : null;
  };

  // Function to check if URL is a Vimeo URL and extract the video ID
  const getVimeoId = url => {
    const regExp =
      /(?:vimeo\.com\/(?:video\/)?|player\.vimeo\.com\/video\/)([0-9]+)/i;
    const match = url.match(regExp);
    return match ? match[1] : null;
  };

  // Function to check if URL is a Spotify URL
  const getSpotifyEmbedUrl = url => {
    if (!url.includes('spotify.com')) return null;

    let spotifyEmbed: string | null = null;

    if (url.includes('/track/')) {
      const trackId = url.split('/track/')[1]?.split('?')[0];
      if (trackId)
        spotifyEmbed = `https://open.spotify.com/embed/track/${trackId}`;
    } else if (url.includes('/album/')) {
      const albumId = url.split('/album/')[1]?.split('?')[0];
      if (albumId)
        spotifyEmbed = `https://open.spotify.com/embed/album/${albumId}`;
    } else if (url.includes('/playlist/')) {
      const playlistId = url.split('/playlist/')[1]?.split('?')[0];
      if (playlistId)
        spotifyEmbed = `https://open.spotify.com/embed/playlist/${playlistId}`;
    } else if (url.includes('/episode/')) {
      const episodeId = url.split('/episode/')[1]?.split('?')[0];
      if (episodeId)
        spotifyEmbed = `https://open.spotify.com/embed/episode/${episodeId}`;
    }

    return spotifyEmbed;
  };

  // Function to check if URL is a SoundCloud URL
  const isSoundCloudUrl = url => {
    return url.toLowerCase().includes('soundcloud.com');
  };

  useEffect(() => {
    if (!url) {
      setPreviewValid(false);
      setPreviewComponent(null);
      return;
    }

    try {
      new URL(url);

      if (type === 'video') {
        // Check for YouTube
        const youtubeId = getYoutubeId(url);
        if (youtubeId) {
          setPreviewValid(true);
          setPreviewComponent(
            <div className="aspect-video">
              <iframe
                src={`https://www.youtube.com/embed/${youtubeId}`}
                title={title || 'YouTube Preview'}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full rounded-md"
              ></iframe>
            </div>
          );
          return;
        }

        // Check for Vimeo
        const vimeoId = getVimeoId(url);
        if (vimeoId) {
          setPreviewValid(true);
          setPreviewComponent(
            <div className="aspect-video">
              <iframe
                src={`https://player.vimeo.com/video/${vimeoId}?h=1080&color=0088cc&title=0&byline=0&portrait=0`}
                title={title || 'Vimeo Preview'}
                frameBorder="0"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                className="w-full h-full rounded-md"
              ></iframe>
            </div>
          );
          return;
        }

        // Direct video URL
        if (/\.(mp4|webm|ogg|mov)$/i.test(url)) {
          setPreviewValid(true);
          setPreviewComponent(
            <div className="aspect-video">
              <video
                src={url}
                controls
                className="w-full h-full rounded-md"
                title={title || 'Video Preview'}
              >
                Your browser does not support the video tag.
              </video>
            </div>
          );
          return;
        }
      }

      if (type === 'audio') {
        // Check for Spotify
        const spotifyEmbed = getSpotifyEmbedUrl(url);
        if (spotifyEmbed) {
          setPreviewValid(true);
          setPreviewComponent(
            <div className="aspect-video">
              <iframe
                src={spotifyEmbed}
                title={title || 'Spotify Preview'}
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                className="w-full h-full rounded-md"
              ></iframe>
            </div>
          );
          return;
        }

        // Check for SoundCloud
        if (isSoundCloudUrl(url)) {
          setPreviewValid(true);
          setPreviewComponent(
            <div className="aspect-[4/3]">
              <iframe
                src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(
                  url
                )}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true`}
                title={title || 'SoundCloud Preview'}
                frameBorder="0"
                allow="autoplay"
                className="w-full h-full rounded-md"
              ></iframe>
            </div>
          );
          return;
        }

        // Direct audio URL
        if (/\.(mp3|wav|ogg|m4a)$/i.test(url)) {
          setPreviewValid(true);
          setPreviewComponent(
            <audio
              src={url}
              controls
              className="w-full"
              title={title || 'Audio Preview'}
            >
              Your browser does not support the audio tag.
            </audio>
          );
          return;
        }
      }

      // URL is valid but not a supported media type
      setPreviewValid(false);
      setPreviewComponent(
        <div className="p-6 flex flex-col items-center justify-center">
          <AlertTriangle className="h-8 w-8 text-yellow-500 mb-2" />
          <p className="text-center text-yellow-500">
            URL doesn't appear to be a supported {type} format.
          </p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 text-sm text-blue-400 hover:underline flex items-center"
          >
            Check URL <ExternalLink className="ml-1 h-3 w-3" />
          </a>
        </div>
      );
    } catch (e) {
      // Invalid URL format
      setPreviewValid(false);
      setPreviewComponent(
        <div className="p-6 flex flex-col items-center justify-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mb-2" />
          <p className="text-center text-red-500">Please enter a valid URL</p>
        </div>
      );
    }
  }, [url, type, title]);

  if (!url) return null;

  return (
    <Card className="bg-gray-900/30 border border-gray-800 mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-md">Media Preview</CardTitle>
      </CardHeader>
      <CardContent>{previewComponent}</CardContent>
    </Card>
  );
};

export default MediaUrlPreview;
