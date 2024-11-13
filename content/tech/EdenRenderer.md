+++
date = "2023-09-10T00:00:00-00:00"
title = "EdenRenderer: Software Rasterizer"
image = "EdenRenderer/Dragon.png"
alt = ""
color = "#060D14"
description = "Software renderer"
preview_images = ["EdenRenderer/Dragon.png"]
preview_text = ["Rasterization"]
preview_aspect_ratios = [1.7777]

+++


EdenRenderer is a software renderer that written with C++, using GLUT for display.

This project implemented rasterization pipeline including
- Space transformation, 
- Depth testing, 
- Frustum culling, 
- Barycentric interpolation. 
- Support model loading using assimp.
- Support uv albedo texture mapping, normal mapping.
- Blinn-Phong lighting model shading.

{{< video "/images/EdenRenderer/Display.mp4" >}}



github link: https://github.com/Edenlia/EdenRenderer
