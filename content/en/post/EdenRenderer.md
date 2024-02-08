---
date: 2023-09-13T11:15:58-04:00
description: "Software renderer"
featured_image: "/images/EdenRenderer/Dragon.png"
tags: []
title: "EdenRenderer"
---

EdenRenderer is a software renderer that written with C++, using GLUT for display.

This project implemented rasterization pipeline including space transformation, depth testing, frustum culling, barycentric interpolation. Also support model and texture loading using assimp, stb lib. Shading uses Blinn-Phong lighting model, and using normal map to improve quality.

{{< video "/images/EdenRenderer/Display.mp4" >}}



github link: https://github.com/Edenlia/EdenRenderer
