+++
title = "Unreal Engine 物理绳子模拟(3): 构造绳子物理系统架构，实现物理循环"
date = 2026-02-16T16:00:00+08:00
lastmod = 2026-02-16T16:00:00+08:00
draft = true

+++

# 前言

前两篇blog将PBD和XPBD的算法核心，Constraint求解的数学公式进行了推导，接下来，就是需要将其实现在代码中了。这篇blog会先讲一些在代码具体实现前的一些UE啊，Chaos啊的背景知识，然后说一下整套系统的架构，最后是整套系统的实现。那么闲言少叙，直入主题。

# 背景知识

本项目采用的Unreal版本是Unreal Engine 5.4，在UE从大版本4->5的更新中，游戏默认的物理引擎从Nvidia开源的PhysX引擎转向了Epic团队自己研发的Chaos引擎，而且代码不再以sdk形式存在，而是以source code的形式直接放在Unreal Engine的repo中了，这也使得我们可以直接去从源码窥探Chaos的精髓，也是我们在写自己的物理模拟的时候可以进行参考的对象。

Chaos由非常多部分组成，这里挑几个比较重要的部分来稍微介绍一下：

1. 刚体物理
2. 破碎效果
3. 布料模拟

## Chaos刚体物理

刚体物理是游戏世界中，运用最广，重要性最高的一部分。

我们平时在使用UE开发时，总绕不开给StaticMesh设置碰撞体啊，给SkeletalMesh设置Physics Asset资源啊，给Character设置胶囊体啊的活儿，这些所谓的“碰撞体”在物理底层本质上就是一个又一个的刚体。熟悉UE的朋友可能注意到过我们在设置Tick执行时序的时候，Tick Group的名称是Pre Physics, During Physics, Post Physics，这里所谓的"Physics"，主要也就是在做刚体物理的解算工作。而上文提到过UE4->UE5物理引擎从PhysX转向Chaos，其实替换的也就是把刚体物理相关的代码。

具体要完整实现一套刚体物理涉及到非常多的内容，例如Trace啊，CCD啊，加速结构啊，这里就先不做过多讲解（之后如果在写绳子物理引擎时需要再说），如果对Chaos感兴趣的朋友可以去阅读其他大佬写的文章，例如 https://zhuanlan.zhihu.com/p/396641853。

这里就从最底层算法出发介绍两件事儿，一是Chaos的刚体物理是由什么解算的；二是刚体物理相比我们的绳子物理一个最大的区别点。先说第一个，我们从源代码出发，Chaos的刚体物理解算最终执行一个timestep执行的函数是FPBDRigidsEvolutionGBF::AdvanceOneTimeStep，从这个类型名称就可以发现，Chaos的刚体物理解算用的也是PBD算法！

