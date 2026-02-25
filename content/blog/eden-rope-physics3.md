+++
title = "Unreal Engine 物理绳子模拟(3): 构造绳子物理系统架构，实现物理循环"
date = 2026-02-16T16:00:00+08:00
lastmod = 2026-02-16T16:00:00+08:00
draft = true

+++

# 前言

前两篇blog将PBD和XPBD的算法核心，Constraint求解的数学公式进行了推导，接下来就是进行代码施工了。这篇blog会先讲一些一些UE啊，Chaos啊的背景知识，然后说一下整套系统的架构，最后是整套系统的实现。那么闲言少叙，直入主题。

# 背景知识

本项目采用的Unreal版本是Unreal Engine 5.4，在UE从大版本4->5的更新中，游戏默认的物理引擎从Nvidia开源的PhysX引擎转向了Epic团队自己研发的Chaos引擎，而且代码不再以sdk形式存在，而是以source code的形式直接放在Unreal Engine的repo中了，这也使得我们可以直接去从源码窥探Chaos的精髓，也是我们在写自己的物理模拟的时候可以进行参考的对象。

Chaos在整体上是一个较为庞大的系统，其中包含了非常多的部分，例如刚体物理，布料模拟，软体模拟，破碎效果等，但最主要，也是这里想稍微介绍一下的是刚体物理部分。

刚体物理是游戏世界中，运用最广，重要性最高的一部分。

我们平时在使用UE开发时，总绕不开给StaticMesh设置碰撞体啊，给SkeletalMesh设置Physics Asset资源啊，给Character设置胶囊体啊的活儿，这些所谓的“碰撞体”在物理底层本质上就是一个又一个的刚体。熟悉UE的朋友可能注意到过我们在设置Tick执行时序的时候，Tick Group的名称是Pre Physics, During Physics, Post Physics，这里所谓的"Physics"，主要也就是在做刚体物理的解算工作。而上文提到过UE4->UE5物理引擎从PhysX转向Chaos，其实替换的也就是刚体物理相关的代码。

具体要完整实现一套刚体物理涉及到非常多的内容，例如Trace啊，CCD啊，加速结构啊，SOA数据布局啊，这里就先不做过多讲解（之后如果在写绳子物理引擎时需要再说），如果对Chaos感兴趣的朋友可以去阅读其他大佬写的文章，例如 https://zhuanlan.zhihu.com/p/396641853。

这里就介绍个两件事儿，一是Chaos的刚体物理是由什么解算的；二是想聊一下刚体物理与基于点的物理的区别。

先说第一点，我们从源代码出发，Chaos的刚体物理解算最终执行一个timestep执行的函数是`FPBDRigidsEvolutionGBF::AdvanceOneTimeStep`，从这个类型名称就可以发现，Chaos的刚体物理解算用的也是PBD算法！所以底层执行也就是在做那么几件事儿 ：1.位置预测，2.碰撞约束创建，3.约束求解，4.回写速度，这与我们绳子物理要做的事儿是一致的。

不过，在工程上，数学求解方法本质是个工具，大伙最关注的其实是运行速度，而在刚刚说的这几步中，碰撞约束创建是非常非常耗的一步，因此在别的文章中，很多会提到的宽相（Broad Phase），窄相（Narrow Phase）啥的物理执行步骤，本质上就是在对**碰撞约束创建**这一步的速度进行优化。由此可见，Chaos底层的数学原理其实也不是什么高深莫测，只是做了很多工程上的优化而已。

再说说第二点，这里主要想提一嘴的是粒子动力学（Particle Dynamic）和刚体动力学（RigidBody Dynamic）的区别，我们的绳子在进行构造的时候会使用传统的粒子动力学（至少一开始是，后续如果要考虑扭转再说），我们在每帧关注和维护的量主要就是位置$\mathbf{x}$和速度$\mathbf{v}$。而刚体动力学额外还需要考虑另外两个量，旋转(表示为四元数)$q$和角速度$\bm{\omega}$。对这方面底层原理感兴趣的朋友可以去看cmu课程的 Lecture Notes，由浅入深，讲的嘎嘎好：https://www.cs.cmu.edu/~baraff/sigcourse/。

刚刚也提到了，在刚体物理之外，还有像布料模拟，软体模拟等物理特性，这些模拟解算的实现是独立于刚体世界的，也就是不在一个Solver中一起计算的，这里也就不赘述了，之后如果需要再去做参考。

# 绳子物理系统构建

上一章节稍微介绍了一下Chaos物理引擎，一方面是为了让大家对物理引擎的框架有一个大致的了解，另一方面是因为我们的绳子系统还是希望能够与Chaos的物理世界进行一定程度的交互的，完全不了解其结构的话后续也不是很好做。

那么好，接下来正式到了我们自己的绳子物理系统的构建上来了，一上来先给取个名儿吧，就叫EdenRope了，后续都会用这个名称代称我们的物理系统。

## 绳子的物理表示

我们首先要做的是，是搞清楚绳子在物理世界中应如何表示。我们为了一开始实现的简洁性，我们可以直接把绳子这个连续的物体通过点的形式离散化成一组无旋转属性的Particles，设把绳子分成$n$段，则总共会产生$n+1$个Particle $p_0,p_1,...,p_n$

> 如果需要绳子响应类似于扭转（twist）的特性，则不能简单把绳子看做是一个个的Particle，需要根据Cosserat Theory去对绳子的物理性质进行一些分析，重新建模。
>
> 这里找了两篇应该算是应用较广的绳子模型的论文，如果后续有时间再去做下论文阅读以及实现（开坑
>
> Position-based Elastic Rods (PBED): http://www.nobuyuki-umetani.com/publication/2014_sca_positionbasedelasticrod/2014_sca_PositionBasedElasticRod.pdf
>
> Position and Orientation Based Cosserat Rods (POBCR): https://animation.rwth-aachen.de/media/papers/2016-SCA-Cosserat-Rods.pdf

Particle之间通过两两间的内部距离约束（Distance Constraint）$C_\text{d}$连接，保证绳子不会散架。

然后每三个连续的particle间会再连接一个弯曲约束（Bend Constraint）$C_\text{b}$，保证绳子不会产生过分弯折。

如下图是一个总共3节的绳子，可以看到由4个Particle，3个距离约束和2个弯曲约束组成：

![rope_geom](/images/Blogs/eden-rope-physics3/rope_geom_representation.png)

我们用数学公式来表示一下这两种内部约束

### 距离约束

 距离约束描述的是希望两个粒子的距离为一个定长$l$。相邻两个顶点都有一个距离约束，设顶点为$p_a,p_b$

 约束函数： $C_d(\mathbf{x}_a, \mathbf{x}_b)=||\mathbf{x}_a- \mathbf{x}_b||-l$

 可求得偏导： $\nabla_{\mathbf{x}_a}C_d=\frac{\mathbf{x}_a- \mathbf{x}_b}{||\mathbf{x}_a- \mathbf{x}_b||}$，$\nabla_{\mathbf{x}_b}C_d=\frac{\mathbf{x}_b- \mathbf{x}_a}{||\mathbf{x}_a- \mathbf{x}_b||}$

代入XPBD迭代公式求解即可

### 弯曲约束

由于物理结构不同，绳子的弯曲约束与PBD论文中布料的弯曲约束不同，考虑连续的三个顶点$p_a,p_b,p_c$，可以使用中间particle位置$\mathbf{x}_b$到a,c连线的投影点距离来表示。设投影点位置为$\mathbf{p}$

约束函数： $C_{pb}(\mathbf{x}_a, \mathbf{x}_b,\mathbf{x}_c)=||\mathbf{x}_b-\mathbf{p}||$

至于偏导一般会用杠杆原理梯度近似求得，设: 

$\mathbf{n}=\frac{\mathbf{x}_b-\mathbf{p}}{||\mathbf{x}_b-\mathbf{p}||}$，

$s=||\mathbf{x}_a-\mathbf{x}_c||$，

$s_1=\text{sign}\{(\mathbf{x}_c-\mathbf{x}_a)\cdot{(\mathbf{x}_b-\mathbf{x}_a)}\}\cdot||\mathbf{x}_a-\mathbf{p}||$，

$s_2=\text{sign}\{(\mathbf{x}_a-\mathbf{x}_c)\cdot{(\mathbf{x}_b-\mathbf{x}_c)}\}||\mathbf{x}_b-\mathbf{p}||$

有偏导：$\nabla_{\mathbf{x}_a}C_{pb}=\frac{s_2}{s}\mathbf{n}$，$\nabla_{\mathbf{x}_b}C_{pb}=-\mathbf{n}$, $\nabla_{\mathbf{x}_c}C_{pb}=\frac{s_1}{s}\mathbf{n}$

同样代入XPBD迭代公式求解即可
