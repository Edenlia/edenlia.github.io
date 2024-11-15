(function() {
    var $ = document.querySelector.bind(document),
        $$ = document.querySelectorAll.bind(document)

    function shuffle(items) {
        // 0 to items.length - 1
        let indices = Array.from({length: items.length}, (v, k) => k)

        for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }

        let shuffledItems = []
        for (let i = 0; i < indices.length; i++) {
            let index = indices[i]
            shuffledItems.push(items[index])
        }

        return shuffledItems
    }

    const preview_row_1 = $('.preview-row-1')
    // const preview_row_2 = $('.preview-row-2')
    const preview_row_3 = $('.preview-row-3')

    let real_preview_items = $$('.preview-item')

    let real_game_items = Array.from(real_preview_items).filter(item =>
        item.classList.contains('game-related')
    );

    let real_cg_items = Array.from(real_preview_items).filter(item =>
        item.classList.contains('cg-related')
    );

    // console.log(real_preview_items.length)

    // Shuffle game-related and cg-related items separately
    real_game_items = shuffle(real_game_items)
    real_cg_items = shuffle(real_cg_items)

    for (let i = 0; i < real_game_items.length; i++) {
        let item = real_game_items[i]
        item.classList.add('from-right')
        preview_row_1.appendChild(item)
    }

    for (let i = 0; i < real_cg_items.length; i++) {
        let item = real_cg_items[i]
        item.classList.add('from-left')
        preview_row_3.appendChild(item)
    }

    // Reassign real_preview_items, make sure the sort is correct
    real_preview_items = $$('.preview-item')

    // // After shuffling all real preview items, add preview placeholder items
    // // Each row has 5 placeholders to make sure the real preview items are correct
    // for (let i = 0; i < 5; i++) {
    //     let placeholder = document.createElement('div')
    //     placeholder.classList.add('preview-item', 'grid-16-9', 'from-right', 'placeholder')
    //     preview_row_1.appendChild(placeholder)
    // }

    // for (let i = 0; i < 5; i++) {
    //     let placeholder = document.createElement('div')
    //     placeholder.classList.add('preview-item', 'grid-16-9', 'from-left', 'placeholder')
    //     preview_row_3.appendChild(placeholder)
    // }

    const offsetXRight = 600; // 目标位置（可以根据需要调整）
    const offsetXLeft = -600;
    const targetX = 0;
    let currentItemIndex = 0; // 当前动画中的元素索引
    const speed = 0.03;

    function lerp(start, end, t) {
        return start + (end - start) * t;
    }

    for (let i = 0; i < real_preview_items.length; i++) {
        let item = real_preview_items[i];
        let offsetX;
        if (item.classList.contains('from-right')) {
            offsetX = offsetXRight;
        }
        else if (item.classList.contains('from-left')) {
            offsetX = offsetXLeft;
        }
        else {
            offsetX = 0;
        }
        item.style.transform = `translateX(${offsetX}px)`;
        item.style.opacity = 0;
    }


    // Preview main blend in, opacity from 0 to 1
    let preview_main = $('.preview-main')
    preview_main.style.opacity = 0;


    function animate_main() {
        let currentOpacity = 0;
        let targetOpacity = 1;
        let mainSpeed = 0.012;

        function move() {
            currentOpacity = lerp(currentOpacity, targetOpacity, mainSpeed);

            // console.log(currentOpacity)
            preview_main.style.opacity = currentOpacity;

            if (currentOpacity < 0.999) {
                requestAnimationFrame(move);
            }
            else {
                preview_main.style.opacity = targetOpacity;
            }
        }

        move();
    }

    function animate_names() {

    }


    // 添加延迟参数（单位：毫秒）
    const preview_row_1_delay = 0;      // 第一行延迟
    const preview_row_3_delay = 1200;   // 第三行延迟
    const preview_main_delay = 3000;    // preview_main 延迟

    // 分离动画函数
    function animateRow(items) {
        let currentIndex = 0;
        const itemDelay = 0; // 每个item之间的延迟时间（毫秒）
        
        function animateItem() {
            if (currentIndex >= items.length) return;
            
            let item = items[currentIndex];
            startAnimation(item, () => {
                currentIndex++;
                // 延迟一段时间后开始下一个item的动画
                setTimeout(animateItem, itemDelay);
            });
        }
        
        animateItem();
    }

    function startAnimation(item, onComplete) {
        let offsetX = item.classList.contains('from-right') ? offsetXRight : offsetXLeft;
        let startX = offsetX;
        let currentX = startX;
        let hasTriggeredNext = false;  // 标记是否已触发下一个动画

        function move() {
            currentX = lerp(currentX, targetX, speed);
            item.style.transform = `translateX(${currentX}px)`;

            const progress = (currentX - startX) / (targetX - startX);
            item.style.opacity = progress;

            // 检查是否过半
            let overHalf = startX > targetX ? 
                currentX < (startX + targetX) / 2 : 
                currentX > (startX + targetX) / 2;

            // 过半且还没触发过下一个动画
            if (overHalf && !hasTriggeredNext) {
                hasTriggeredNext = true;
                if (onComplete) onComplete();
            }

            if (Math.abs(currentX - targetX) > 0.1) {
                requestAnimationFrame(move);
            } else {
                item.style.transform = `translateX(${targetX}px)`;
                item.style.opacity = 1;
            }
        }

        move();
    }

    // 启动所有动画
    setTimeout(() => {
        const row1Items = Array.from(preview_row_1.querySelectorAll('.preview-item:not(.placeholder)'));
        animateRow(row1Items);
    }, preview_row_1_delay);

    setTimeout(() => {
        const row3Items = Array.from(preview_row_3.querySelectorAll('.preview-item:not(.placeholder)'));
        animateRow(row3Items);
    }, preview_row_3_delay);

    setTimeout(() => {
        animate_main();
    }, preview_main_delay);

    // 添加拖动功能
    function enableDragging(row) {
        let isDragging = false;
        let startX;
        let startY;
        let scrollLeft;
        let clickStartTime;
        let hasMoved = false;
        
        // 添加动量相关变量
        let velocity = 0;
        let lastX = 0;
        let lastTime = 0;
        let animationFrameId = null;

        // 阻止所有链接的默认拖动行为
        row.querySelectorAll('a').forEach(link => {
            link.addEventListener('dragstart', (e) => e.preventDefault());
        });

        function updateVelocity(currentX) {
            const now = Date.now();
            const dt = Math.max(1, now - lastTime);
            const dx = currentX - lastX;
            velocity = dx / dt;
            lastX = currentX;
            lastTime = now;
        }

        function momentumScroll() {
            if (Math.abs(velocity) < 0.01) {
                cancelAnimationFrame(animationFrameId);
                return;
            }

            // 应用摩擦力
            velocity *= 0.95;

            // 更新滚动位置
            row.scrollLeft -= velocity * 16; // 16ms 是一帧的近似时间
            animationFrameId = requestAnimationFrame(momentumScroll);
        }

        // 触摸事件处理 (新增)
        row.addEventListener('touchstart', (e) => {
            cancelAnimationFrame(animationFrameId);
            
            isDragging = true;
            const touch = e.touches[0];
            startX = touch.pageX - row.offsetLeft;
            startY = touch.pageY;
            scrollLeft = row.scrollLeft;
            clickStartTime = new Date().getTime();
            hasMoved = false;
            
            // 重置动量追踪
            velocity = 0;
            lastX = touch.pageX;
            lastTime = Date.now();
        }, { passive: false });

        row.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            e.preventDefault();

            const touch = e.touches[0];
            const x = touch.pageX - row.offsetLeft;
            const y = touch.pageY;
            const moveX = Math.abs(x - startX);
            const moveY = Math.abs(y - startY);

            if (moveX > 5 || moveY > 5) {
                hasMoved = true;
                const walk = (x - startX) * 2;
                row.scrollLeft = scrollLeft - walk;
                
                // 更新速度
                updateVelocity(touch.pageX);
            }
        }, { passive: false });

        row.addEventListener('touchend', (e) => {
            if (!isDragging) return;
            
            isDragging = false;
            const clickEndTime = new Date().getTime();
            const clickDuration = clickEndTime - clickStartTime;
            
            if (hasMoved || clickDuration > 200) {
                e.preventDefault();
                // 开始动量滚动
                momentumScroll();
            }
        }, { passive: false });

        // 保持所有现有的鼠标事件处理器不变
        row.addEventListener('mousedown', (e) => {
            // 停止任何正在进行的动量滚动
            cancelAnimationFrame(animationFrameId);
            
            isDragging = true;
            row.style.cursor = 'grabbing';
            startX = e.pageX - row.offsetLeft;
            startY = e.pageY;
            scrollLeft = row.scrollLeft;
            clickStartTime = new Date().getTime();
            hasMoved = false;
            
            // 重置动量追踪
            velocity = 0;
            lastX = e.pageX;
            lastTime = Date.now();
        });

        row.addEventListener('mouseleave', () => {
            if (isDragging) {
                isDragging = false;
                row.style.cursor = 'grab';
                // 开始动量滚动
                momentumScroll();
            }
        });

        row.addEventListener('mouseup', (e) => {
            if (!isDragging) return;
            
            isDragging = false;
            row.style.cursor = 'grab';

            const clickEndTime = new Date().getTime();
            const clickDuration = clickEndTime - clickStartTime;
            
            if (hasMoved || clickDuration > 200) {
                e.preventDefault();
                e.stopPropagation();
                // 开始动量滚动
                momentumScroll();
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;

            const x = e.pageX - row.offsetLeft;
            const y = e.pageY;
            const moveX = Math.abs(x - startX);
            const moveY = Math.abs(y - startY);

            if (moveX > 5 || moveY > 5) {
                hasMoved = true;
                e.preventDefault();
                const walk = (x - startX) * 2;
                row.scrollLeft = scrollLeft - walk;
                
                // 更新速度
                updateVelocity(e.pageX);
            }
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                row.style.cursor = 'grab';
                // 开始动量滚动
                momentumScroll();
            }
        });

        row.addEventListener('click', (e) => {
            if (hasMoved) {
                e.preventDefault();
                e.stopPropagation();
            }
        }, true);

        let wheelVelocity = 0;
        let wheelAnimationFrameId = null;

        function wheelMomentumScroll() {
            if (Math.abs(wheelVelocity) < 0.01) {
                cancelAnimationFrame(wheelAnimationFrameId);
                return;
            }

            // 更温和的减速
            wheelVelocity *= 0.92;

            row.scrollLeft += wheelVelocity;
            wheelAnimationFrameId = requestAnimationFrame(wheelMomentumScroll);
        }

        // 添加滚轮事件监听
        row.addEventListener('wheel', (e) => {
            e.preventDefault();

            cancelAnimationFrame(wheelAnimationFrameId);

            // 降低初始速度
            const scrollSpeed = 1.5;
            // 使用 Math.sign 来确保滚动更加平滑
            wheelVelocity = Math.sign(e.deltaY) * Math.min(Math.abs(e.deltaY), 50) * scrollSpeed;

            wheelMomentumScroll();
        }, { passive: false });
    }

    // 在动画完成后启用拖动和滚轮功能
    setTimeout(() => {
        preview_row_1.style.cursor = 'grab';
        preview_row_3.style.cursor = 'grab';
        preview_row_1.style.overflowX = 'hidden';
        preview_row_3.style.overflowX = 'hidden';
        enableDragging(preview_row_1);
        enableDragging(preview_row_3);
    }, preview_row_3_delay + 2000);

})()
