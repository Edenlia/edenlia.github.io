+++
title = "Unreal Engine 物理绳子模拟(2): XPBD(Extended Position Based Dynamics)方法导读"
date = 2026-02-16T11:00:00+08:00
lastmod = 2026-02-16T11:00:00+08:00
draft = false

+++

# 前言

上一篇blog详细讲了PBD的Constraint的求解推导，理论上我们已经可以按照论文的公式开始写代码了，但是这个算法其实有一个很大的痛点，就是我们用于表示约束"*刚度*"的$s$实际上是*假的*，它本质上是一个经验公式给出的量，是非物理的。具体表现出来的现象是，就算我们设置死了一个Constraint的$s$值不变，在不同的iteration设置下，Constraint的硬度还是会有所不同。为解决这个问题，PBD的原作者Matthias Müller又推出了PBD的"加强版本"，也就是这篇blog的主角儿 XPBD。

PBD的方法导读可以查阅上一篇blog

# XPBD(Extended Position Based Dynamics)

## 1. 简介

XPBD的论文链接: https://matthias-research.github.io/pages/publications/XPBD.pdf

XPBD的完整模拟步骤如下：

![overview](/images/Blogs/eden-rope-physics2/xpbd_overview.png) 

模拟的流程基本和PBD的一样（虽然变量名称和符号全换了...），简单看一下可以看到，一开始还是在做位置预测，中间在求解constraint，最后更新位置和速度。

核心不同的地方在于，在PBD中，Constraint的求解是直接获得$\Delta{\mathbf{x}}$，而XPBD在计算$\Delta\mathbf{x}$前，还多计算了一个$\lambda$和$\Delta\lambda$，搞懂这俩玩意儿是啥在干啥是理解这篇论文的关键。

这里可以先小小做一下剧透，XPBD的这个$\lambda$最后算出来的形式与上一篇文章中，拉格朗日乘子法中设置的拉格朗日乘子$\lambda$算出来的形式是类似的。所以这篇论文推导的具体过程明明没有用拉格朗日乘子法，却在文中将之称为拉格朗日乘子（Lagrange multiplier）的完整形式。

## 2.数据定义

老样子，为了让后续推导清晰明了，还是先把我们的数据的变量定义写写出来，变量名与上一篇blog的定义一致。

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

## 3. XPBD约束求解

### 3.1 迭代求解公式推导

为保证这一次推出来的公式是物理正确的，我们需要分析一下设置的Constraint蕴含的能量以及Constraint使粒子受力的情况。

Constraint给粒子提供的力可以被看做是一种保守力（conservative force），记作$\mathbf{F}_\text{elastic}(\mathbf{X})$，保守力可以被写作与势能相关的公式，根据牛顿经典力学公式可以得出：

$$\begin{equation} M\cdot{\ddot{\mathbf{X}}} = -\nabla_{\mathbf{X}}{U^{\top}(\mathbf{X})} = \mathbf{F}_\text{elastic}(\mathbf{X}) \end{equation}$$

其中，$\ddot{\mathbf{X}}$是位置对时间求两次导数，也就是加速度（位置对时间求一次导数是速度，速度再对时间求一次导数是加速度）

$U$是势能(potential energy)函数，与约束函数类似，这个函数的维度信息如下：

- $U(\mathbf{X}): \mathbb{R}^{n\times{}3}\to\mathbb{R}$
- $\nabla_{\mathbf{X}}U^{\top}(\mathbf{X})\in\mathbb{R}^{n\times{}3}$
- 第$i$行是$\nabla_{\mathbf{x}_i}U^{\top}(\mathbf{X})\in\mathbb{R}^3$

我们对这个方程在时刻$t_k$做一次**时间尺度上的离散**，即$\ddot{\mathbf{X}}\approx\frac{\mathbf{X}^{k+1}-2\mathbf{X}^k+\mathbf{X}^{k-1}}{\Delta{t^2}}$, 将时间导数用位置表示，并用**隐式欧拉**做梯度近似, 可以**近似**得到公式：

$$\begin{equation} M\cdot(\frac{\mathbf{X}^{k+1}-2\mathbf{X}^k+\mathbf{X}^{k-1}}{\Delta{t^2}}) \approx -\nabla_{\mathbf{X}}{U^{\top}(\mathbf{X}^{k+1})} \end{equation}$$

我们再来考虑势能与Constraint函数间的关系，在PBD的推导中，我们一般每次只关注单个Constraint函数$C(\mathbf{X})$，但在考虑粒子在某一个时刻的势能时，则需要考虑到与其相关的所有的Constraint（直观理解，每个constraint都提供了一些势能，同时考虑才能算出最终势能），因此我们需要组合所有Constraint得到$\mathbf{C}(\mathbf{X})=[C_1(\mathbf{X}), C_2(\mathbf{X}),...,C_m(\mathbf{X})]^\top:\mathbb{R}^{m}\times\mathbb{R}^{n\times3}\to\mathbb{R}^{m}$，我们现在**设定**势能函数和Constraint的关系为：

$$\begin{equation} U(\mathbf{X})=\frac12\mathbf{C}(\mathbf{X})^\top\bm{\alpha}^{-1}\mathbf{C}(\mathbf{X})\end{equation}$$

其中，$\bm{\alpha}\in\mathbb{R}^{m\times{}m}$是一个表示**柔顺度**(complicance)的**对角**矩阵(矩阵中的每个元素为$\alpha_j\in\mathbb{R}$，$\alpha_j$是一个标量，指代第j个Constraint的柔顺度)

将刚刚的(3)式两边对$\mathbf{X}$求导可得：

$$\begin{equation} \mathbf{F}_\text{elastic}(\mathbf{X}) = -\nabla_{\mathbf{X}}{U^{\top}(\mathbf{X})}=-\nabla_{\mathbf{X}}\mathbf{C}(\mathbf{X})^\top\bm{\alpha}^{-1}\mathbf{C}(\mathbf{X}) \end{equation}$$

得到这些公式后，我们现在考虑$t_k\to{}t_{k+1}$的解算，先做一些变量定义：

- $\tilde{\mathbf{X}}^k\coloneqq 2\cdot{\mathbf{X}}^k-{\mathbf{X}}^{k-1}\approx{\mathbf{X}}^k+\Delta{t}\cdot{\mathbf{V}}^k$：用一个在$t_k$时间速度的近似让我们不再依赖$t_{k-1}$的信息，这种做法是"隐式"的，不会导致数值爆炸
- $\tilde{\bm{\alpha}}\coloneqq \frac{\bm{\alpha}}{\Delta{}t^2}$

然后引入变量lambda的定义（如上文所述，这个在论文中被称为完整的拉格朗日乘子 total lagrange multiplier）：

$$\begin{equation} \bm\lambda_\text{elastic}=-\tilde{\bm\alpha}^{-1}\cdot{\mathbf{C}}(\mathbf{X}) \end{equation}$$

考虑一个具体时刻的值：$\bm{\lambda}_{\text{elastic}}(\mathbf{X}^{k+1})\equiv\bm{\lambda}_{\text{elastic}}^{k+1}\coloneqq -\tilde{\bm{\alpha}}^{-1}\mathbf{C}(\mathbf{X}^{k+1})\in\mathbb{R}^{m}$，可以看到，这是一个m列的列向量，其中**每个元素**为$\lambda_j\in\mathbb{R}$，是一个标量，代表了第j个Constraint的lambda值，下文把$\bm{\lambda}_{\text{elastic}}$简写成$\bm\lambda$

现在，结合(2)(4)两个公式，并把刚刚定义的变量代入，能够得到公式：

$$\begin{equation} M\cdot({\mathbf{X}^{k+1}-\tilde{\mathbf{X}}^k})-\nabla_{\mathbf{X}}\mathbf{C}(\mathbf{X}^{k+1})^\top\bm{\lambda}^{k+1}=\mathbf{0} \end{equation}$$

以及根据我们刚刚对lambda变量的定义，重组一下得到：

$$\begin{equation} \mathbf{C}(\mathbf{X}^{k+1})+\tilde{\bm{\alpha}}\bm{\lambda}^{k+1}=\mathbf{0} \end{equation}$$

关注这两个公式，我们可以发现**未知量**仅有$\mathbf{X}^{k+1},\bm{\lambda}^{k+1}$这两个。

回顾一下我们整个Constraint求解的目标，我们的目标即是求解出 $\mathbf{X}^{k+1}$ （$t_{k+1}$的位置信息），因此看起来现在最好联立一些方程，用些什么迭代啊，近似啊求解就行。

事实证明XPBD的作者也是这么想的，文中又做了一次函数定义，将我们的问题重新构造一下，先设定方程组：

$$\begin{equation} \begin{cases} \mathbf{g}(\mathbf{X},\bm{\lambda})=M\cdot({\mathbf{X}-\tilde{\mathbf{X}}^k})-\nabla_{\mathbf{X}}\mathbf{C}(\mathbf{X})^\top\bm{\lambda} \\ \mathbf{h}(\mathbf{X},\bm{\lambda})=\mathbf{C}(\mathbf{X})+\tilde{\bm{\alpha}}\bm{\lambda} \end{cases} \end{equation}$$

我们现在的目标即是，找到一对$\hat{\mathbf{X}},\hat{\bm{\lambda}}\equiv\mathbf{X}^{k+1},\bm{\lambda}^{k+1}$，使得：

$$\begin{equation} \begin{cases} \mathbf{g}(\hat{\mathbf{X}},\hat{\bm{\lambda}})=\mathbf{0} \\ \mathbf{h}(\hat{\mathbf{X}},\hat{\bm{\lambda}})=\mathbf{0} \end{cases} \end{equation}$$

类似于隐式欧拉的做法，我们可以联立一下这俩方程，设置一下初始值，然后进行**牛顿-拉夫森迭代**：

设迭代初始值：

- $\hat{\mathbf{X}}^{(0)}=\tilde{\mathbf{X}}^k$
- $\hat{\bm\lambda}^{(0)}=\mathbf{0}$

看第$p$次迭代，我们有$\hat{\mathbf{X}}^{(p)},\hat{\bm{\lambda}}^{(p)}$，有公式：

$$\begin{equation} \begin{bmatrix} \frac{\partial{\mathbf{g}}}{\partial{\mathbf{X}}} & \frac{\partial{\mathbf{g}}}{\partial{\bm\lambda}} \\ \\ \frac{\partial{\mathbf{h}}}{\partial{\mathbf{X}}} & \frac{\partial{\mathbf{h}}}{\partial{\bm\lambda}} \\ \end{bmatrix} \begin{bmatrix} \hat{\Delta{{\mathbf{X}}}}^{(p)} \\ \\ \hat{\Delta{\bm\lambda}}^{(p)} \\ \end{bmatrix} = - \begin{bmatrix} \mathbf{g}(\hat{\mathbf{X}}^{(p)},\hat{\bm\lambda}^{(p)}) \\ \\ \mathbf{h}(\hat{\mathbf{X}}^{(p)},\hat{\bm\lambda}^{(p)}) \end{bmatrix}  \end{equation}$$

我们只要有最左侧这一个雅可比行列式的公式，即能得到$\hat{\Delta{{\mathbf{X}}}}^{(p)},\hat{\Delta{\bm\lambda}}^{(p)}$，然后进行迭代：

- $\hat{\mathbf{X}}^{(p+1)}=\hat{\mathbf{X}}^{(p)}+\hat{\Delta{{\mathbf{X}}}}^{(p)}$
- $\hat{\bm{\lambda}}^{(p+1)}=\hat{\bm{\lambda}}^{(p)}+\hat{\Delta{{\bm{\lambda}}}}^{(p)}$

因为这本质上是一个牛顿-拉夫森迭代问题，因此需要设置停止条件，停止条件为：

- $|\hat{\mathbf{X}}^{(p+1)}-\hat{\mathbf{X}}^{(p)}|\to\mathbf{0}$
- $|\hat{\bm{\lambda}}^{(p+1)}-\hat{\bm{\lambda}}^{(p)}|\to\mathbf{0}$

有了具体的迭代公式，我们只需要计算出雅可比行列式中的每个偏导，即可得到最终的迭代公式，经过计算能够得到：

- $\frac{\partial{\mathbf{g}}}{\partial{\bm\lambda}}=-\nabla\mathbf{C}_\mathbf{X}^\top(\hat{\mathbf{X}}^{(p)})$
- $\frac{\partial{\mathbf{h}}}{\partial{\mathbf{X}}}=\nabla\mathbf{C}_\mathbf{X}(\hat{\mathbf{X}}^{(p)})$
- $\frac{\partial{\mathbf{h}}}{\partial{\bm{\lambda}}}=\tilde{\bm{\alpha}}$

这三个的计算都比较简单，然而$\frac{\partial{\mathbf{g}}}{\partial{\mathbf{X}}}$的偏导的计算需要计算Constraint函数的Hessian矩阵（求导再求导），成本过大了，在XPBD论文原文中，作者用质量矩阵$M$近似了这个值，按作者说可以保持偏差在$O(\Delta{t}^2)$，原文没有给具体证明，当个结论吧。

由此我们得到了：

$\frac{\partial{\mathbf{g}}}{\partial{\mathbf{X}}}\approx\mathbf{M}$，这里使用加粗的原因是这个值推出来是一个$\mathbb{R}^{n*m\,\times\,n*m}$的对角矩阵，直观理解可以理解为这是一个mxm的对角阵，而每一个元素都是一个$M\in\mathbb{R}^{n\times{}n}$，因此维度是$\mathbb{R}^{n*m\,\times\,n*m}$

同时，再做最后一个近似，$\mathbf{g}(\hat{\mathbf{X}}^{(p)},\hat{\bm\lambda}^{(p)})\approx\mathbf{0}$

在把这些数据和公式全部代入后，能够得到$\hat{\Delta{{\mathbf{X}}}}^{(p)},\hat{\Delta{\bm\lambda}}^{(p)}$的计算公式：

$$\begin{equation} [\nabla_\mathbf{X}{\mathbf{C}(\hat{\mathbf{X}}^{(p)})\cdot{}\mathbf{M}^{-1}}\cdot{}\nabla_\mathbf{X}\mathbf{C}(\hat{\mathbf{X}}^{(p)})^\top+\tilde{\bm{\alpha}}]\cdot \hat{\Delta{\bm\lambda}}^{(p)} = -\mathbf{C}(\hat{\mathbf{X}}^{(p)})-\tilde{\bm{\alpha}}\hat{\bm{\lambda}}^{(p)} \end{equation}$$

$$\begin{equation}\hat{\Delta{{\mathbf{X}}}}^{(p)}=\mathbf{M}^{-1}\cdot\nabla\mathbf{C}_\mathbf{X}(\hat{\mathbf{X}}^{(p)})^\top \hat{\Delta{\bm{\lambda}}}^{(p)} \end{equation}$$

我们先考虑$\lambda$更新公式的每一行，每一行代表的是一个Constraint，每个都可以独立求解，重排一下就可以得到第j个Constraint的更新公式为：

$$\begin{equation} \hat{\Delta{\lambda_j}}^{(p)} =\frac{-{C}_j(\hat{\mathbf{X}}^{(p)})-\tilde{{\alpha}_j}\hat{{\lambda}_j}^{(p)}}{{\Sigma{}w_i||\nabla_{\mathbf{x}_i}C_j(\hat{\mathbf{X}}^{(p)})||^2}+\tilde{{\alpha}}_j} \end{equation}$$

把第二个公式也分解一下，考虑第j行，这时我们会发现，我们需要更新的delta position值不止一个，因为每一个Constraint会约束多个顶点，在得到Constraint的delta lambda后，需要再计算每个particle在这个Constraint的delta position：

$$\begin{equation} \hat{\Delta{{\mathbf{x}_i}}}^{(p)}=w_i\cdot\nabla_{\mathbf{x}_i}{C}_j(\hat{\mathbf{X}}^{(p)}) \hat{\Delta{\lambda}_j}^{(p)} \end{equation}$$

### 3.2 与PBD的联系

上一节中，靠着我们不断的设置变量、近似公式、问题转化。最终是把原问题变成了一个用牛顿-拉夫森迭代来求解的问题，并得出了具体的迭代公式。我们先不关注具体如何使用这两个公式，先把它俩的迭代标记清理清理，重新写一下，有：

$$\begin{equation} {\Delta{\lambda_j}} =\frac{-{C}_j({\mathbf{X}})-\tilde{{\alpha}_j}{{\lambda}_j}}{{\Sigma{}w_i||\nabla_{\mathbf{x}_i}C_j({\mathbf{X}})||^2}+\tilde{{\alpha}}_j} \end{equation}$$

$$\begin{equation} {\Delta{{\mathbf{x}_i}}}=w_i\cdot{\Delta{\lambda}_j}\cdot\nabla_{\mathbf{x}_i}{C}_j({\mathbf{X}}) \end{equation}$$

有没有觉得这两个公式及其的眼熟。回顾PBD用拉格朗日乘子法求解出来的结果，有：

$$\begin{equation}\lambda_j=-\frac{C(\mathbf{X}^k)}{\Sigma{}w_i||\nabla_{\mathbf{x}_i}C(\mathbf{X}^k)||^2}\end{equation}$$

$$\begin{equation} {\Delta{{\mathbf{x}_i}}}=w_i\cdot{{\lambda}_j}\cdot\nabla_{\mathbf{x}_i}{C}_j({\mathbf{X}})  \end{equation}$$

可以发现，位置信息相对于$\lambda$的更新策略是完全没变的！XPBD推导出的公式只是对$\lambda$的更新策略略有不同，多了一项关于柔顺度的项。同时，如果$\bm\alpha$为0的话，XPBD的公式就会退化回PBD的公式。

### 3.3 迭代

3.1节的结尾给出了每个Constraint的独立求解公式，如果严格按照文中的牛顿-拉夫森迭代的方法去迭代的话，纯按照公式，其实是要把所有Constraint都求解一遍出来，然后把delta值一次性的累加给粒子，也就是说可以进行并行化求解（which is 提高运算速度的好方法）。

然而，这也不是说PBD中的Gauss-Seidel迭代就不可用了，按照 1 给出的算法概述，论文作者使用的是for循环，也就是还是用Gauss-Seidel串行的去进行求解了，串行求解完一遍，也就算是完成一次牛顿-拉夫森迭代了。

估计这两者算出的结果误差也不大，纯看数学公式谁优谁劣也分析不出个所以然来，还得是code it up看看效果以及运行速度再决定方法。

同时，我们建立牛顿-拉夫森迭代问题的时候说是要设置停止条件，等到迭代的delta值很小的情况下再停止迭代，但是runtime应用往往没有那么多时间供我们算的，因此真正写成代码，还是要手动设置iteration值，iteration次数用完了就停。

# 结语

到此，我们总算是把PBD和XPBD论文的核心部分给推导完了，其实这两篇论文的原文中还有一些具体工程实践时的内容，比如PBD论文中讲了如何构建布料的constraint，XPBD论文讲了如何把damping放进constraint求解中。但这些部分与最核心的Constraint求解无关，我们真实要做绳子的物理模拟也不一定用的上，所以这里也就不过多赘述了（如果后面在做的时候要使用到再回来补）。

完成了这些推导，我们就已经掌握了进行简单绳子模拟所需的所有必要知识，下一篇，就要真正开始去讲绳子构建和算法循环的内容了，也是终于要开始进行代码施工了（带好安全帽）。