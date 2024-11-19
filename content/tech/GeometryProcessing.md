+++
date = "2024-02-01T00:00:00-00:00"
title = "Geometry Processing"
image = "Dirt/veach_mis.png"
alt = ""
color = "#060D14"
description = ""
cover_image = "GeometryProcessing/reconstruction.png"
preview_images = ["GeometryProcessing/reconstruction.png"]
preview_text = ["Point Cloud Reconstruction"]
preview_aspect_ratios = [1.6]
+++

Assignment of CSCI 599: Geometry Processing from USC

Geometry processing is an essential part of various DCC software and game engines. 

This repository digs into the underlying mathematical principles of each geometry processing algorithm, implementing thes algorithms from scratch, and providing a deep understanding of their mechanics.

Geometry processing algorithm includes:

- Point cloud **Reconstruction** to Mesh
- Mesh **Registration**
- Triangle Mesh **Subdivision**
- Triangle Mesh **Decimation**
- Noisy Mesh **Smoothing**

### Reconstruction

When camera scan the surface of real-world objects, we can only obtain **point cloud** of the object. However, when rendering in a computer, we typically need to represent the geometry as a **triangle mesh**. Therefore, we require a method to reconstruct the point cloud into a triangle mesh.

This section implemented a version of "**Possion Surface Reconstruction**". 

![reconstruction](/images/GeometryProcessing/reconstruction.png)

### Registration

When performing surface reconstruction, it is common to use multiple cameras to scan the object from different angles. Usually we don't have the relative distances between the cameras, it make this process challenging. Therefore, we hope to have an algorithm that can align different parts of the same object's surface, this process called **registration**.

This section implemented a version of "**Iterative closest point**" to make registration. 

| ![registration_1](/images/GeometryProcessing/registration_1.png) | ![registration_2](/images/GeometryProcessing/registration_2.png) |
| :----------------------------------------------------------: | :----------------------------------------------------------: |
|                              1                               |                              2                               |
| ![registration_3](/images/GeometryProcessing/registration_3.png) | ![registration_4](/images/GeometryProcessing/registration_4.png) |
|                              3                               |                              4                               |

### Subdivision

When representing surfaces as **triangle meshes**, the level of detail is often insufficient to capture smooth and complex shapes accurately. To improve the smoothness and refine the geometry, **subdivision** methods are commonly used. Subdivision techniques iteratively add more vertices and faces to the mesh, creating a finer and smoother result.

This section implemented a version of "**Loop Subdivision**", a popular subdivision method specifically designed for triangle meshes.

| ![subdivision_1](/images/GeometryProcessing/subdivision_1.png) | ![subdivision_2](/images/GeometryProcessing/subdivision_2.png) |
| :----------------------------------------------------------: | :----------------------------------------------------------: |
|                              1                               |                              2                               |
| ![subdivision_3](/images/GeometryProcessing/subdivision_3.png) | ![subdivision_4](/images/GeometryProcessing/subdivision_4.png) |
|                              3                               |                              4                               |

### Decimation

To optimize the complexity of **triangle meshes**, especially for rendering or real-time applications, it is often necessary to reduce the number of triangles while preserving the overall shape and appearance of the mesh. This process, known as **mesh decimation**, simplifies the geometry without significantly degrading visual quality.

This section implemented a version of the "**Quadric Simplification Method (QSM)**".

| ![decimate_2](/images/GeometryProcessing/decimate_2.png) | ![decimate_3](/images/GeometryProcessing/decimate_3.png) |
| :------------------------------------------------------: | :------------------------------------------------------: |
|                            1                             |                            2                             |
| ![decimate_4](/images/GeometryProcessing/decimate_4.png) | ![decimate_5](/images/GeometryProcessing/decimate_5.png) |
|                            3                             |                            4                             |

### Smoothing

When working with **triangle meshes**, irregularities or noise in the geometry can negatively impact the visual quality and downstream processing. To address this, **mesh smoothing** is used to create a cleaner and more uniform surface while maintaining the essential features of the geometry.

This section implemented a version of **smoothing using the cotangent Laplacian**.

| ![smoothing_data_1](/images/GeometryProcessing/smoothing_data_1.png) | ![smoothing_data_2](/images/GeometryProcessing/smoothing_data_2.png) | ![smoothing_data_3](/images/GeometryProcessing/smoothing_data_3.png) |
| :----------------------------------------------------------: | :----------------------------------------------------------: | :----------------------------------------------------------: |
|                              1                               |                              2                               |                              3                               |

