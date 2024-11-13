---
date: 2024-01-12T10:58:08-04:00
description: "Advanced web facial renderer"
featured_image: "/images/WebVHuman/WebVHuman1.png"
tags: [""]
title: "WebVHuman"
---

WebVHuman is an advanced facial renderer crafted using the latest cross-platform API, WebGPU. This project is designed to render human face on the website with high performance.

The  project implemented physical based rendering technics includes microfacet BRDF, shadow map (PCF), and real-time subsurface scattering. 

{{< video type="local" src="/images/WebVHuman/LightRotation.mp4" >}}

## Microfacet BRDF



For running fast in real-time, microfacet BRDF use Kelemen and Szirmay-Kalos model.

$$f_{r,spec}=D\cdot{F}\cdot{G}$$

$$F(F_0, \theta_h)=(1-\cos\theta_h)^5+F_0(1-(1-\cos\theta_h)^5)$$

$$D(\theta_h, \alpha))=\frac{e^{-\frac{\tan^2\theta_h}{\alpha^2}}}{\alpha^2\cos^4\theta_h}$$

$$G(\textbf{v},\textbf{l})=(\textbf{v}+\textbf{l})^2=\textbf{h}\cdot\textbf{h}$$

This model only used for simulate specular light, diffuse lights will be described in subsurface scattering section.

## PCF

Percentage-Closer Filtering (PCF) is an real-time shadow technic that based on shadow map. In the context of shadow mapping, rather than having a single depth comparison for a fragment, multiple samples within a specified area around the fragment are compared against the depth map. 

![PCF](/images/WebVHuman/PCF.png)

This project also adapted an advanced sampling method called poisson disk sampling instead of square sampling.

## Subsurface scattering

Subsurface scattering use diffusion profiles to approximate, which consider the scattering is the same in all directions and the angle is irrelevant.

![diffusion profile](/images/WebVHuman/diffusionProfile.jpg)

Then, based on the Donner and Jensen's paper, use 6 gaussian cores to approximate human skin's subsurface scattering.

![GaussianCore](/images/WebVHuman/GaussianCore.jpg)

Use these 6 gaussian cores, we can draw 6 irradiance textures, here is one of them.

![irradiance](/images/WebVHuman/irradiance.png)

Finally, takes the weighed average of these 6 irradiance textures to generate the diffuse color.

github link: https://github.com/Edenlia/WebVHuman



**Reference**:

Donner, Craig, and Henrik Wann Jensen. 2005. "Light Diffusion in Multi-Layered Translucent Materials." In *ACM Transactions on Graphics (Proceedings of SIGGRAPH 2005)* 24(3).

Donner, Craig, and Henrik Wann Jensen. 2006. "A Spectral BSSRDF for Shading Human Skin." In *Rendering Techniques (Proceedings of the Eurographics Symposium on Rendering 2006)*, pp. 409–417.

Donner, Craig, and Henrik Wann Jensen. 2007. "Rendering Translucent Materials Using Photon Diffusion." In *Rendering Techniques (Proceedings of the Eurographics Symposium on Rendering 2007)*.

Nvidia GPU Gems 3 Advanced Techniques for Realistic Real-Time Skin Rendering.
