+++
date = "2023-10-13T00:00:00-00:00"
title = "D3DRT: Real-time DX12 RayTracer"
image = "D3DRT/display.png"
alt = ""
color = "#060D14"
description = "Ray Tracing Renderer based on DirectX12 Raytracing API"
cover_image = "D3DRT/display.png"
preview_images = ["D3DRT/sobol.png"]
preview_text = ["Low Discrepancy Sequence Sampling: Halton"]
preview_aspect_ratios = [1.777]

+++

D3DRT is a physical based raytracing renderer based on DirectX 12 Raytracing. This project implemented Disney's paper "[Physically-Based Shading at Disney](https://media.disneyanimation.com/uploads/production/publication_asset/48/asset/s2012_pbs_disney_brdf_notes_v3.pdf)"

## Features

**Implement rasteration and raytracing pipelines and can switch render mode in runtime.**

![switch_mode](/images/D3DRT/switch_mode.gif)

**Implement multiple materials (Blinn-Phong and Disney Principled) in rasteration mode.**

![Rasteration](/images/D3DRT/Rasteration.png)

**imgui change material parameters in runtime**

![imgui](/images/D3DRT/imgui.gif)

**Important sampling for Disney principled BRDF**

Uniform sampling(left), Important sampling(right), using 500ssp: 

![Important sampling](/images/D3DRT/Important_sampling.png)

**Low Discrepancy Sequence for denoise**

Pseudorandom number(left), Halton sequence number(right), using 20ssp: 

![sobol](/images/D3DRT/sobol.png)

github link: https://github.com/Edenlia/D3DRT.git

## Reference

https://developer.nvidia.com/rtx/raytracing/dxr/DX12-Raytracing-tutorial-Part-1

https://github.com/microsoft/DirectX-Graphics-Samples

https://github.com/AKGWSB/EzRT
