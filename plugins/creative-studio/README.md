# Creative Studio

Image generation with **OpenAI GPT Image** (the model behind ChatGPT's image generator) and **Google Gemini**, plus a playbook so Claude uses the whole **Adobe for creativity** connector: Express, Photoshop-grade editing, Illustrator vectors, Firefly Boards, Fonts, Stock, Acrobat and video. Canva is deliberately left out.

## What's inside

| Part | What it does |
|------|--------------|
| `server/image-studio.mjs` | MCP server with `generate_image`, `edit_image` and `list_image_providers`. No dependencies; needs Node 18+. |
| `skills/image-generation` | Chooses OpenAI or Gemini for each job, writes good prompts, checks the result, then hands over to Adobe. Never uses Canva. |
| `skills/adobe-creative-suite` | Maps every creative task to the right Adobe connector tool: uploads, masks, adjustments, cut-outs, generative expand, vectorise, Express designs, Firefly Boards, fonts, PDF and video. |

## Step 1: get API keys

A **ChatGPT Plus/Pro** or **Google AI Pro (Gemini)** subscription doesn't include API access. You need one or both of these keys:

| Provider | Where | Billing |
|----------|-------|---------|
| OpenAI | platform.openai.com → API keys | Pay-as-you-go, separate from ChatGPT |
| Gemini | aistudio.google.com → Get API key | Separate from your Google AI Pro subscription; add billing in AI Studio for the image models |

Check each provider's current per-image prices before heavy use.

## Step 2: use it in Claude Code (terminal, desktop or IDE)

1. Put your keys in `~/.claude/settings.json`:
   ```json
   {
     "env": {
       "OPENAI_API_KEY": "sk-...",
       "GEMINI_API_KEY": "...",
       "IMAGE_DEFAULT_PROVIDER": "openai"
     }
   }
   ```
2. Install the plugin: run `/plugin`, add this repository as a marketplace, then install **creative-studio**.
3. Test it: *"List image providers"*, then *"Generate a 4:5 product shot of a frosted glass serum bottle on travertine, soft morning light."*

Images are saved to `generated-images/` in the current project. Set `IMAGE_OUTPUT_DIR` to change the folder.

## Step 3: use it in Cowork, claude.ai and the mobile app

These surfaces reach tools through **connectors**, which are MCP servers on the internet. Run the server in HTTP mode on any Node host (e.g. Render, Railway or Fly.io):

```bash
OPENAI_API_KEY=sk-... GEMINI_API_KEY=... \
IMAGE_STUDIO_TOKEN=$(openssl rand -hex 24) \
node server/image-studio.mjs --http --port 8787
```

Then, in claude.ai, go to **Settings → Connectors → Add custom connector** and use this URL:

```
https://<your-host>/mcp?token=<IMAGE_STUDIO_TOKEN>
```

The token stops anyone who finds the URL from spending your API credit. Keep it secret, and change it if it leaks. In HTTP mode, images come back inline in the chat, and input images must be `https://` URLs (for example, an Adobe tool's `outputUrl`).

To get the two skills in Cowork, upload this plugin folder, or add this repository as a plugin marketplace, from Cowork's plugin settings.

## Settings

| Variable | Default | Purpose |
|----------|---------|---------|
| `OPENAI_API_KEY` | — | Turns on the `openai` provider |
| `GEMINI_API_KEY` | — | Turns on the `gemini` provider (`GOOGLE_API_KEY` also works) |
| `IMAGE_DEFAULT_PROVIDER` | `openai` if its key is set | `openai` or `gemini` |
| `OPENAI_IMAGE_MODEL` | `gpt-image-2.5-sunburst` | Use `gpt-image-2.5-flare` for faster, cheaper output, or `gpt-image-2` |
| `GEMINI_IMAGE_MODEL` | `gemini-3-pro-image` | Use `gemini-3.1-flash-image` for faster, cheaper output |
| `IMAGE_OUTPUT_DIR` | `generated-images` | Where images are saved (stdio mode) |
| `IMAGE_STUDIO_TOKEN` | — | Required for `--http` mode; at least 24 characters |

## What Adobe can't do through the connector

- **No Firefly text-to-image tool.** The connector offers Firefly generative expand, Firefly Boards and your past Firefly generations, but it can't create new images from a prompt. That's why this plugin adds OpenAI and Gemini. To get Firefly's own commercially safe output, generate at firefly.adobe.com; Claude can then find those images with `asset_search`.
- **Illustrator is limited to vectorising.** `image_vectorize` produces editable SVG to open in Illustrator. Opening, editing or scripting `.ai` files isn't available.
