import React from 'react';

const VideoPlayer = ({ videoLink }) => {
  if (!videoLink) return null;

  // Convert Google Drive share link to embeddable format
  const getEmbedUrl = (url) => {
    const driveMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (driveMatch) {
      return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
    }
    return url;
  };

  return (
    <div className="video-consultation">
      <h3>Video Consultation</h3>
      <div className="video-container">
        <iframe
          src={getEmbedUrl(videoLink)}
          title="Video Consultation"
          width="100%"
          height="480"
          allow="autoplay"
          allowFullScreen
        />
      </div>
      <a href={videoLink} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
        Open in new tab
      </a>
    </div>
  );
};

export default VideoPlayer;
