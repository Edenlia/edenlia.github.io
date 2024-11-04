+++
date = "2017-05-15T21:52:57-07:00"
title = "EdenRenderer: Software Rasterizer"
image = "EdenRenderer/Dragon.png"
alt = ""
color = "#060D14"
description = "Software renderer"
preview_images = []
preview_text = []
preview_aspect_ratios = []

+++


EdenRenderer is a software renderer that written with C++, using GLUT for display.

This project implemented rasterization pipeline including space transformation, depth testing, frustum culling, barycentric interpolation. Also support model and texture loading using assimp, stb lib. Shading uses Blinn-Phong lighting model, and using normal map to improve quality.

{{< video "/images/EdenRenderer/Display.mp4" >}}



github link: https://github.com/Edenlia/EdenRenderer
