# Gemini Vision Integration

This document explains how to use the new Gemini Vision capabilities integrated into the mental health chatbot.

## Overview

The Gemini API now includes powerful vision capabilities that allow the chatbot to analyze images and videos. This functionality can be used to:

- Describe images in detail
- Analyze video content
- Detect objects in images 
- Transcribe videos with visual descriptions
- Process multiple images at once

## How to Use

1. First, ensure the chatbot is set to **Gemini API mode** using the toggle in the sidebar
2. Upload an image or video using the paperclip icon in the chat input
3. Enable **Vision mode** by clicking the Vision toggle button that appears when media is attached
4. Type a prompt describing what you want to know about the media
5. Send your message

The AI will analyze your uploaded media and respond with detailed information based on your prompt.

## Feature Details

### Image Analysis

Upload any image (JPG, PNG, WEBP, HEIC, HEIF) and the system will analyze it based on your prompt. Examples:

- "Describe what's in this image in detail"
- "What emotions might the person in this photo be experiencing?"
- "Identify potential triggers for anxiety in this image"

### Video Analysis

Videos (MP4, MOV, AVI, etc.) will be analyzed frame by frame, with audio transcription if available. Useful prompts:

- "Summarize the key points in this video"
- "Transcribe this video with timestamps and visual descriptions"
- "What's the overall mood conveyed in this video?"

### Multiple Image Analysis

Upload multiple images to compare them or analyze them as a set. Example prompts:

- "Compare the mood in these images"
- "What common elements appear in all these images?"
- "Describe how these images might relate to each other"

### Object Detection

Request specific information about objects in images:

- "Identify any plants or animals in this image"
- "Detect signs of distress in this photo"
- "Find any text in this image and transcribe it"

### YouTube Integration

You can also analyze YouTube videos by pasting a YouTube URL in your message.

## Technical Limitations

- Images should be less than 20MB for optimal performance
- Videos should ideally be under 10 minutes (maximum 90 minutes)
- Processing large videos may take extra time
- YouTube videos must be public (not private or unlisted)

## Privacy Considerations

- All media is processed securely through the Gemini API
- Files are automatically deleted after 48 hours
- Consider the sensitivity of media you upload as it will be processed by Google's services

## Troubleshooting

If you encounter issues:

- Ensure you're in Gemini API mode, not LMStudio mode
- Check that your files meet the size and format requirements
- Try with a smaller or different file if processing takes too long
- Ensure your prompt clearly describes what you want to know about the media

For further assistance, please contact support. 