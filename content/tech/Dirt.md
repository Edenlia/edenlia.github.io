+++
date = "2024-04-18T00:00:00-00:00"
title = "Dirt: Offline Ray Tracer"
image = "Dirt/veach_mis.png"
alt = ""
color = "#060D14"
description = ""
cover_image = "Dirt/veach_mis.png"
preview_images = ["Dirt/veach_mis.png", "Dirt/perlin_noise.png", "Dirt/env_map_high.png", "Dirt/volume_rendering.png"]
preview_text = ["Multiple Importance Sampling", "Procedural Texture", "Environment Map", "Volume Rendering"]
preview_aspect_ratios = [1.5, 1, 1, 1]
+++

Assignment of 15668: Physics Based Rendering from CMU

Dirt is a ray tracer written in C++ from scratch.

Features:

- Scene Representation: Sphere, Quads and Mesh
- Materials: Lambertian, Metal, Dielectric, BlinnPhong, Beckmann etc.
- Sampler: Stratified Sampling, Quasi-Monte Carlo Sampling
- Integrators: Material Path Tracer, MIS Path Tracer
- Environment Map
- Volumetric Rendering
- Procedural Textures

### Materials

This Project implemented several materials: **Lambertian**, **Metal**, **Dielectric**, **BlinnPhong**, **Beckmann** etc.

| ![env_map](/images/Dirt/cornell-box.png) | ![env_map](/images/Dirt/glossy_cornell_box.png) |
| :--------------------------------------: | :---------------------------------------------: |
|                Lambertain                |                     Glossy                      |
|  ![env_map](/images/Dirt/beckmann.png)   |       ![env_map](/images/Dirt/phong.png)        |
|                 Beckmann                 |                      Phong                      |



### Sampler

Generating high-quality samples is crucial for producing realistic and noise-free images. The sampler determines how sample points are distributed, impacting the convergence rate and overall visual fidelity of the rendered image.

This Project implemented three types of samplers: **Independent Sampler**; **Stratified Sampler**; **Halton Sampler**.

Here is the outputs by different samplers with the same **16** samples:

| ![sampler_ball_ind](/images/Dirt/sampler_ball_ind.png) | ![sampler_ball_strat](/images/Dirt/sampler_ball_strat.png) | ![sampler_ball_halton](/images/Dirt/sampler_ball_halton.png) |
| :----------------------------------------------------: | :--------------------------------------------------------: | :----------------------------------------------------------: |
|                  independent sampler                   |                     stratified sampler                     |                        halton sampler                        |

### Integrators

In Path Tracing, the integrator is responsible for computing the radiance along sampled paths, determining how light interacts with surfaces and contributes to the final image. The choice of integrator greatly influences the accuracy and efficiency of the rendering process.

This Project implemented three types of integrators: **Material Important sampling Integrator**; **Light Important sampling Integrator**; **Multiple (Material and Light) Importance sampling Integrator MIS** .

Here is the outputs by different integrators with same **50** samples:

| ![integrator_veach_mats](/images/Dirt/integrator_veach_mats.png) | ![integrator_veach_nee](/images/Dirt/integrator_veach_nee.png) | ![integrator_veach_mis](/images/Dirt/integrator_veach_mis.png) |
| :----------------------------------------------------------: | :----------------------------------------------------------: | :----------------------------------------------------------: |
|                           Material                           |                           Lighting                           |                             MIS                              |

### Volumetric Rendering

volumetric rendering is used to simulate light interactions within participating media, such as fog, smoke, or water. This technique captures effects like scattering, absorption, and emission, adding depth and realism to scenes with complex atmospheres.

This Project implemented **volumetric rendering**.

| ![volume](/images/Dirt/volume_rendering.png) |
| :------------------------------------------: |
|             Volumetric rendering             |



### Environment Map

This Project implemented Environment Map.

| ![env_map](/images/Dirt/env_map_high.png) | ![numbers_bg](/images/Dirt/numbers_bg.png) |
| ----------------------------------------- | ------------------------------------------ |

### Procedural Texture

This Project implemented procedural texturing using **Perlin Noise**.

| ![perlin](/images/Dirt/perlin_noise.png) |
| :--------------------------------------: |
|               Perlin noise               |
