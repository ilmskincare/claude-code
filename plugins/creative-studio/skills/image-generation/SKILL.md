---
name: image-generation
description: Generate or edit images with OpenAI GPT Image (the ChatGPT image model) or Google Gemini through the image-studio tools, then hand off to Adobe for finishing. Use whenever the user asks to generate, create, make, draw, render or mock up an image, photo, illustration, product shot, icon, sticker, logo concept, texture or artwork, or to restyle, retouch with AI, or combine existing images. Never route image generation to Canva.
---

# Image generation (OpenAI + Gemini → Adobe)

The user pays for Adobe Creative Cloud, ChatGPT and Gemini Pro, and does **not** want Canva used. Generate with the `image-studio` MCP tools, finish with the Adobe connector (see the `adobe-creative-suite` skill).

## Tools

| Tool | Use |
|------|-----|
| `generate_image` | Text → image. Saves files, returns paths and a preview. |
| `edit_image` | Image(s) + instruction → new image. Takes local paths or https URLs (including an Adobe tool's `outputUrl`). |
| `list_image_providers` | Check which providers have keys. Call it first if a generation fails with "not configured". |

Never call `mcp__Canva__generate-image` or any other Canva tool, even when it's available.

## Choosing a provider

The user rates ChatGPT's generator highest, so default to `openai` unless there's a reason below to use Gemini.

| Need | Provider | Why |
|------|----------|-----|
| Legible text in the image (packaging, labels, headlines, UI) | `openai` | Strongest text rendering |
| Transparent background (logo, sticker, product cut-out) | `openai` + `transparent_background: true` | Gemini has no transparency option |
| Photorealistic product or lifestyle shots | `openai` (try `gemini` as a second opinion) | |
| 4K output, or ratios like 4:5, 21:9, 5:4 exactly | `gemini` + `image_size: "4K"` | OpenAI snaps to 1:1, 3:2, 2:3 |
| Keeping a face, product or character consistent across edits | `gemini` via `edit_image` | Strong reference-image consistency |
| The user names a provider | That one | |

If one provider refuses or errors, say so and offer the other. Don't silently switch.

## Writing the prompt

Write prompts as a short art-direction brief, not a keyword list:

1. **Subject**: what it is, with materials, colour and scale
2. **Setting**: surface, background, props
3. **Light**: e.g. soft window light from the left, golden hour or hard studio flash
4. **Camera and style**: lens and angle for photos (e.g. "85mm, eye level, shallow depth of field"), or medium for illustration (e.g. "flat vector, 2 colours")
5. **Composition**: where the negative space goes if copy will be added later ("clear space top third for headline")
6. **Exact text**: in quotes, spelt out, in UK English

For iLM Beauty work, keep the look understated, clean and ingredient-led: natural materials and soft neutral light. Avoid glossy, over-saturated "AI" styling.

## Workflow

1. Confirm the essentials if they're missing: what it's for (which sets the aspect ratio) and any text that must appear. Don't ask about anything you can sensibly default.
2. Call `generate_image`. Use `n: 2`–`4` only when the user wants options, because each image costs API credit.
3. **Look at the returned preview before replying.** Check it against the brief: spelling of any text, extra fingers, wrong product shape, messy edges. If it's wrong, fix the prompt and regenerate once. Then report honestly and don't claim success for an image you haven't looked at.
4. Tell the user the saved path(s), and show them the image.
5. Offer the Adobe finishing step that fits (see below).

## Handing off to Adobe

Adobe tools need a fetchable URL, so upload the generated file to Creative Cloud first (`asset_initialize_file_upload` → upload → `asset_finalize_file_upload`, following the `adobe-creative-suite` skill). Then:

- **Retouch or grade**: `image_apply_adjustments`, `image_apply_preset`, `image_apply_auto_tone`
- **Cut out**: `image_remove_background`
- **Extend the canvas to another ratio**: `image_generative_expand`, then `image_crop_and_resize`
- **Make it an Illustrator vector**: `image_vectorize` (returns SVG)
- **Build a layout** (post, flyer, deck, packaging mock): the Express design flow via `create_visual_design_express_skill`
- **Mood board**: `boards_create_new_board` + `boards_add_items_to_board`

## If no API key is set

`list_image_providers` will show "not configured". Explain that a ChatGPT Plus/Pro or Gemini Pro (Google AI Pro) subscription **doesn't include API access**. The key comes from:
- OpenAI: platform.openai.com → API keys (pay-as-you-go billing is separate from ChatGPT)
- Gemini: aistudio.google.com → Get API key

Then point them to this plugin's README for where to put the key.
