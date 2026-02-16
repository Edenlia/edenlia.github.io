+++
title = "Unreal Engine 物理绳子模拟(1): 概述及Position Based Dynamics方法导读"
date = 2026-02-10T10:00:00+08:00
lastmod = 2026-02-16T10:00:00+08:00
draft = false

+++

# 前言

作为初入游戏行业的新人，我常常会被游戏中各种“看起来理所当然”的效果震住：角色衣摆的摆动、背包带子的晃动、攀爬时绳索的拉扯与回弹……这些细节能在一瞬间把画面从“能跑”拉到“像真的”；而有些游戏，更是直接将这些效果当做游戏玩法核心的一部分，例如神秘海域和TLOU2的绳索。

这些效果和玩法的实现事实上都离不开游戏开发中一项及其重要的部分：物理系统。对这个庞大系统的好奇心理让我一直很想去尝试实现一个自己的物理系统，而我选择作为切入口的，是绳子的物理模拟。原因也很简单：它足够简单，直观，可以快速进行实现，实现的过程也能基本覆盖物理系统所需的所有知识。

由于这些blog的本质是对物理系统进行学习，所以在实现系统code之外，也会花较大的篇幅用在对使用的物理方法的推导，关于推导相关的几篇blog也可以当做是对论文的导读。但由于本人不是数学专业的，数学推导难免有误，如有发现错误欢迎指正[磕头]。

# Position Based Dynamic

## 1. 简介

Position Based Dynamic(PBD)是Matthias Müller在2006年提出的一种物理模拟方法，其实在绳子模拟上，我是希望用它的进阶版本Extended Position Based Dynamic(XPBD)来做的，但是一上手就看XPBD的文章发现完全看不懂...只能老老实实回来看看PBD补补课。

论文链接: https://matthias-research.github.io/pages/publications/posBasedDyn.pdf

本文提出了一种只依赖于位置和约束的完整模拟步骤，它的完整算法流程如下：

![overview](/images/Blogs/eden-rope-physics1/pbd_overview.png)

我总结下来核心逻辑如下：

**初始化：**

- Particle的初始位置，速度
- Particle间的内部约束

**迭代步骤**：

1. 根据受到的外力预测下个时刻的粒子位置. 对应(5)~(7)
2. 根据预测位置生成碰撞约束(用于描述碰撞). 对应(8)
3. 迭代求解约束，更新位置信息. 对应(9)~(11)
4. 根据最终求得的位置信息，计算出粒子的速度. 对应(16)

预测位置本质上是跑了一个半隐式欧拉(Symplectic Explicit Euler)的时间积分，但与传统的Force Based Dynamic不同的地方在于它的约束求解。

看算法流程公式可以看到，它把"碰撞(Collision)"这个行为也理解成了一种"约束(Constraint)"，并且约束求解直接得到的是**更新后的位置信息**，而不直接考虑速度。速度被当做了因变量，是在确定了位置后，再去计算的。

这就与直觉上感知的，先从受力计算加速度改变，再算速度改变，再算位置改变的逻辑不符。这也导致了我在一开始学习时完全不理解这个算法在干什么...

言归正传，位置和速度都非常好理解，那这个约束到底是个什么？具体怎么运作的？用数学如何表达？这些便是这篇论文的核心。

## 2.数据定义

读了这些篇个物理模拟和渲染相关的论文，逐渐发现了一个道理，就是想看懂这种论文到底讲了什么，一定要提前就搞清楚我们在每一步已知的数据有什么，维度是怎么样的，以及哪些是函数，哪些是变量，否则推着推着就会搞不灵清这是什么那是什么。所以我会先定义清楚在做模拟时，我们"有什么"，"希望得到什么"。

变量标记比较随个人习惯，与原文略有不同，请见谅。

我们设当前的时间为$t_k$, 整个物理系统中总共有$n$个粒子, 粒子间相互有着约束，总共有$m$个约束。

那么在这个$t_k$时刻，我们能给求解器的输入有：

- **时间相关：**
  - $\Delta{t}$: 本次Simulate的用时
  - $t_{k+1}=t_k+\Delta{t}$: Simulate完成后的时刻值
  - $n_{\text{iter}}$: 本次Sim迭代Constraint的Iteration数量
- **粒子属性相关：**
  - $M\in\mathbb{R}^{n\times{n}}$: 粒子的质量矩阵（对角阵）
  - $W\in\mathbb{R}^{n\times{n}}$: 粒子的逆质量矩阵（对角阵）
  - $\mathbf{V}(t_k)\equiv\mathbf{V}^k\in\mathbb{R}^{n\times{3}}$:       $t_k$时刻的所有粒子的线速度
  - $\mathbf{X}(t_k)\equiv\mathbf{X}^k\in\mathbb{R}^{n\times{3}}$:        $t_k$时刻的所有粒子的位置
  - $\mathbf{F}_{\text{ext}}(t_k)\in\mathbb{R}^{n\times{3}}$:                $t_k$时刻的粒子所受外力 
- **约束相关：**
  - $C_1(\mathbf{X}), C_2(\mathbf{X}),...,C_m(\mathbf{X})$：Constraint对粒子位置的函数

我们希望的输出是：

- $\mathbf{V}(t_{k+1})\equiv\mathbf{V}^{k+1}\in\mathbb{R}^{n\times{3}}$:       $t_{k+1}$时刻的所有粒子的线速度
- $\mathbf{X}(t_{k+1})\equiv\mathbf{X}^{k+1}\in\mathbb{R}^{n\times{3}}$:        $t_{k+1}$时刻的所有粒子的位置

速度，位置，外力这些量都非常的直观，因此我们接下来会花较多的时间来讲解约束Constraint这是个什么个玩意

## 3. PBD约束求解

原PBD论文也有一个章节3.3 Constraint Projection专门讲解了PBD约束的求解过程，但不得不吐槽，大佬的跳步实在有点狠... 所以我这里的行文逻辑会尽量让逻辑是顺着走的，不会突然蹦出来一个变量，这与原文会有些不同。

我们的顶点数组是$\mathbf{X}\in\mathbb{R}^{n\times3}$，其中每一行是单个粒子的位置，这里将其写作$\mathbf{x}_i\in\mathbb{R}^3$

Constraint可以被描述成是一个关于顶点的函数：$C(\mathbf{X}): \mathbb{R}^{n\times{}3}\to\mathbb{R}$，即将所有顶点输入进Constraint函数后能够输出一个标量值，这个值代表着"当前状态违反Constraint的程度"。

一般Constraint只与某几个顶点相关（例如Distance Constraint仅关心设置了distance限制的那两个顶点），对其他顶点的函数值都为0无需关心， 我们也可以将其描述为：$C(\mathbf{x}_a, \mathbf{x}_b, ...)$

同时，在描述Constraint的刚度的时候，我们还会给$C$设置一个constant stiffness $s$

### 3.1 求解

**求解目标：**

我们给出了Constraint函数为$C(\mathbf{X})$，而"**完美满足约束**"的数学含义即是$C(\mathbf{X})=\mathbf{0}$

我们设定当前的位置值为$\mathbf{X}^k$，求解的目标是得到一个$\Delta\mathbf{X}$，然后尽可能让**结果逼近0**，即$C(\mathbf{X}^k+\Delta\mathbf{X})={0}$

**优化目标：**

为保证能量守恒，我们还希望得到的$\Delta\mathbf{X}$是**能维持线动量守恒**的，即$\sum^{n}_im_i\Delta\mathbf{x}_i^k=\mathbf{0}$

**求解：**

给定当前的位置值为$\mathbf{X}^k$，根据一次泰勒展开，有：

$$\begin{equation} C(\mathbf{X}^k+\Delta\mathbf{X})\approx{}C(\mathbf{X}^k)+\nabla_{\mathbf{X}}C(\mathbf{X}^k)\cdot\Delta{\mathbf{X}}^\top=0 \end{equation}$$

为了能更好的理解这个公式具体在干什么，可以先关注一下$\nabla_{\mathbf{X}}C(\mathbf{X}^k)$

- 先看维度$\nabla_{\mathbf{X}}C(\mathbf{X}^k)\in\mathbb{R}^{n\times{}3}$
- 再看元素$\nabla_{\mathbf{X}}C(\mathbf{X}^k)$的第$i$行是$\nabla_{\mathbf{x}_i}C(\mathbf{X}^k)\in\mathbb{R}^3$
- 最后看$\nabla_{\mathbf{X}}C(\mathbf{X}^k)\cdot\Delta{\mathbf{X}}^\top$的值，这是一个标量，其本质是两个矩阵点乘完成后取模长的值，完整形式可以写作$\sum_i^n\nabla_{\mathbf{x}_i}C(\mathbf{X}^k)^\top\cdot\Delta{\mathbf{x}_i}$.

根据我们的优化目标公式，我们可以大胆**假设**$\Delta{\mathbf{X}}$需要与$\nabla_{\mathbf{X}}C(\mathbf{X}^k)$同方向，即设定一个标量值 $\ell\in\mathbb{R}$ ，有：
$$\begin{equation}\Delta{\mathbf{X}}=\ell\cdot\nabla_{\mathbf{X}}C(\mathbf{X}^k)\end{equation}$$
细看(2)式，我们观察单行（单个Particle），有$\Delta{\mathbf{x}_i}=\ell\cdot\nabla_{\mathbf{x}_i}C(\mathbf{X}^k)$，看起来只需得到$\ell$的值我们便大功告成，能计算出所有particle的移动，***但这个结论真的对吗？***

举例，对于两个粒子$a,b$的Distance Constraint情况，$\nabla_{\mathbf{x}_a}C_d(\mathbf{X}^k)$与$\nabla_{\mathbf{x}_b}C_d(\mathbf{X}^k)$的结果虽然方向不同，但是向量长度是一样的，这代表它们最后解算得到$\Delta{\mathbf{x}_a},\Delta{\mathbf{x}_b}$后，有$||\Delta{\mathbf{x}_a}||^2=||\Delta{\mathbf{x}_b}||^2$，这显然看着就没那么正确。
在真实的物理世界中，如果两个球被一个弹簧绳所控制，拉长弹簧绳，我们期望的一定是**"轻的球被重的球拉过去的更多"**，即**"重的球的$\Delta{\mathbf{x}}$少于轻的球的$\Delta{\mathbf{x}}$"**。

因此，上式的假设$\Delta{\mathbf{x}_i}=\ell\cdot\nabla_{\mathbf{x}_i}C(\mathbf{X}^k)$并不能最好的反映$\Delta{\mathbf{X}}$真实的方向信息！因为我们没有考虑到质量的影响。考虑质量后，我们可以重新得到**假设公式**：

$$\begin{equation}\Delta{\mathbf{x}_i}=\ell\cdot{w_i}\cdot\nabla_{\mathbf{x}_i}C(\mathbf{X}^k)\end{equation}$$

将其转化为矩阵形式即为：

$$\begin{equation}\Delta{\mathbf{X}}=\ell\cdot{W}\cdot\nabla_{\mathbf{X}}C(\mathbf{X}^k)\end{equation}$$

得到这个公式后，我们再去求解$\ell$。根据我们的假设，有$\ell\in\mathbb{R}^1$，由此我们可以直接将(4)代入(1)可得 $\ell=-\frac{C(\mathbf{X}^k)}{\Sigma{}w_i||\nabla_{\mathbf{x}_i}C(\mathbf{X}^k)||^2}$，在解算这一步时需要特别关注$W\in\mathbb{R}^{n\times{}n}$，与$\nabla_{\mathbf{X}}C(\mathbf{X}^k)$的点乘需要逐行相乘，否则容易算错（我也开始就算错了）。

代入(3)可以直接得到最终结果：

$$\begin{equation}\Delta{\mathbf{x}_i}=-\frac{C(\mathbf{X}^k)}{\Sigma{}w_i||\nabla_{\mathbf{x}_i}C(\mathbf{X}^k)||^2}\cdot{w_i}\cdot\nabla_{\mathbf{x}_i}C(\mathbf{X}^k)\end{equation}$$

### 3.2 另一种求解方法

上文的几乎所有内容都是基于确定的近似或推断，除了(2)~(4)这些式子用了**假设**，实际上，这个所谓的"假设"是为了让理解更加便利，我们其实可以通过数学严格的证明这一过程。

我们可以把上述的问题看做是一个带约束条件的优化问题，我们的优化目标是**最小约束原理（Gauss's Principle of Least Constraint）**给出的尽量保证动量守恒的**最小化质量加权的位移平方范数**：

优化目标：

$$f(\Delta\mathbf{X})=\argmin\{\frac12{\sum^{n}_im_i||\Delta\mathbf{x}_i}||^2\}$$ 

限制条件：

$$g(\Delta{\mathbf{X}})=C(\mathbf{X}^k)+\nabla_{\mathbf{X}}C(\mathbf{X}^k)\cdot\Delta{\mathbf{X}}^\top=0$$

用**拉格朗日乘子法**同样可以证明。

证明：

先引入拉格朗日乘子 (Lagrangian Multiplier) $\lambda$ 并构造拉格朗日函数：

$$\begin{equation}\mathcal{L}(\Delta{\mathbf{X}},\lambda)=f(\Delta\mathbf{X})-\lambda\cdot{}g(\Delta\mathbf{X})\end{equation}$$

具体过程就不细细的推了，本质就是求偏导，然后设置偏导为0，联立方程，一通操作后能够算出：

$$\begin{equation}\lambda=-\frac{C(\mathbf{X}^k)}{\Sigma{}w_i||\nabla_{\mathbf{x}_i}C(\mathbf{X}^k)||^2}\end{equation}$$

然后对于每行（每个x）有：$\Delta\mathbf{x}_i=w_i\lambda\cdot\nabla_{\mathbf{x}_i}C(\mathbf{X}^k)$

得到与之前一样的结论：

$$\begin{equation}\Delta{\mathbf{x}_i}=-\frac{C(\mathbf{X}^k)}{\Sigma{}w_i||\nabla_{\mathbf{x}_i}C(\mathbf{X}^k)||^2}\cdot{w_i}\cdot\nabla_{\mathbf{x}_i}C(\mathbf{X}^k)\end{equation}$$

### 3.3 考虑刚度

(5)式得出的结论，是在Constraint被最大化满足的考量下的，在真实的工程中，我们还希望能够控制Constraint的软硬程度，这时候一般会添加一个scalar项 $s\in[0,1]$ 来表示刚度，由此标准化Constraint，得到最终的计算公式：
$$\begin{equation}\hat{\Delta{\mathbf{x}_i}}=- s\cdot\frac{C(\mathbf{X}^k)}{\Sigma{}w_i||\nabla_{\mathbf{x}_i}C(\mathbf{X}^k)||^2}\cdot{w_i}\cdot\nabla_{\mathbf{x}_i}C(\mathbf{X}^k)\end{equation}$$

*但需要注意：这里的这个scalar项本质是一个经验公式提供的项，它本身没有什么物理意义，因此也导致了PBD一个巨大的问题，即同样的刚度s在不同substeps下物理表现是不一样的。后续的XPBD这项工作就是在解决这个问题*

### 3.4. 举例: 距离约束

 距离约束描述的是希望两个粒子的距离为一个定长$l$。在构筑绳子的时候，一般相邻两个顶点都会添加一个距离约束

 有约束函数：

 $$C_d(\mathbf{x}_a, \mathbf{x}_b)=||\mathbf{x}_a- \mathbf{x}_b||-l$$

 可求得偏导：

 $$\nabla_{\mathbf{x}_a}C_d=\frac{\mathbf{x}_a- \mathbf{x}_b}{||\mathbf{x}_a- \mathbf{x}_b||}, \nabla_{\mathbf{x}_b}C_d=\frac{\mathbf{x}_b- \mathbf{x}_a}{||\mathbf{x}_a- \mathbf{x}_b||}$$

 得到：

 $$\hat{\Delta{\mathbf{x}_a}}=-s\cdot\frac{w_a}{w_a+w_b}(||\mathbf{x}_a- \mathbf{x}_b||-l)\frac{\mathbf{x}_a- \mathbf{x}_b}{||\mathbf{x}_a- \mathbf{x}_b||}$$

 $$\hat{\Delta{\mathbf{x}_b}}=+s\cdot\frac{w_b}{w_a+w_b}(||\mathbf{x}_a- \mathbf{x}_b||-l)\frac{\mathbf{x}_b- \mathbf{x}_a}{||\mathbf{x}_a- \mathbf{x}_b||}$$

 这个Constraint对粒子$a,b$位置的影响值就这么算出来了

## 4. Gauss-Seidel迭代Constraints

上文把约束求解的具体方法完整的推导了一遍，我们可以发现，对**单个Constraint**进行一次求解（Project），本质得到的是几个粒子的$\Delta{\mathbf{x}}$ ，但我们的物理世界实际上是有着$m$个不同的约束的，如何同时考虑这些个约束呢？

PBD采用的方法非常简单，数学上称之为Gauss-Seidel迭代法，本质上就是串行，一个一个算，把每一次的Constraint的Delta值累加到当前使用的$\mathbf{x}_k$上，然后拿累加后的$\mathbf{x}_k$再去做下一个Constraint的求解就好了

# 结语

这篇blog主要就把PBD的Constraint求解给重新推导了一遍，这部分是PBD原文中最难理解的，也是我认为PBD的思想中最重要的一部分，有了这块儿知识的理解，会对后续理解XPBD的算法有很好的帮助。当PBD和XPBD都推导完成后，我们就可以有底气开始正式开始写物理系统了。