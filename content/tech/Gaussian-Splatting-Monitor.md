+++
date = "2024-04-01T00:00:00-00:00"
title = "Gaussian-Splatting-Monitor"
image = "GaussianSplattingStudio/teaser.png"
alt = ""
color = "#060D14"
description = ""
preview_images = ["GaussianSplattingStudio/teaser.png"]
preview_text = ["Multi-Differentiable GS Output"]
preview_aspect_ratios = [1.777]

+++

{{< video "/images/GaussianSplattingStudio/teaser.mp4" >}}



This repository builds upon the "3D Gaussian Splatting for Real-Time Radiance Field Rendering" project by adding new features that enhance its utility for research purposes. 

Originally, Gaussian splatting excells in producing high-quality renderings but is constrained to only rendering RGB images and backpropagating gradients based on RGB loss. This limitation hindered the potential for investigating the volumetric analysis of the Gaussian Splatting (GS) model and the development of novel loss functions. 

In contrast, models derived from Neural Radiance Fields (NeRF) leverage their fully connected MLP architectures to offer greater versatility in processing various input and output features, as well as in crafting loss functions. 

Inspired by these advancements, this codebase supports additional differentiable outputs, aiming to spur innovative research ideas.




web: https://rongliu-leo.github.io/Gaussian-Splatting-Monitor/

github link:  https://github.com/RongLiu-Leo/Gaussian-Splatting-Monitor
