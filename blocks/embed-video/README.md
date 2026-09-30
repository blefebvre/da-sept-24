# embed-video

Custom **embed** block. Purpose: game-video.

## Authoring (Document Authoring)

Model: `standalone`

Single block table. See "Content structure" below.

## Supported variations

No variations.

## Universal Editor fields

N/A (Document Authoring project)

## Content structure

One row, one cell holding the video link, plus an optional poster image:

| Embed Video |
| --- |
| (optional poster image)<br>[https://www.youtube.com/watch?v=wwM8Mah5sAA](https://www.youtube.com/watch?v=wwM8Mah5sAA) |

- Supported: YouTube (`watch?v=`, `youtu.be/`, `/embed/`, `/shorts/`, `/live/`, playlists, `t=` start time) and Vimeo. A plain-text URL also works.
- Players use `youtube-nocookie.com` (or Vimeo `dnt=1`), sized 16:9.
- With a poster image: nothing is requested from the video host until the visitor clicks play, and then the video autoplays.
- Without a poster: the player iframe loads once the block comes near the viewport (including when its tab or accordion item is opened).
- The link text is used as the iframe title when it is not just the URL.
- An unsupported URL is left as a plain link.
