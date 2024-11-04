(function() {
    var $ = document.querySelector.bind(document),
        $$ = document.querySelectorAll.bind(document)


    const preview_items = $$('.preview-item')
    const offsetXRight = 600; // 目标位置（可以根据需要调整）
    const offsetXLeft = -600;
    const targetX = 0;
    let currentItemIndex = 0; // 当前动画中的元素索引
    const speed = 0.03;

    function lerp(start, end, t) {
        return start + (end - start) * t;
    }

    console.log(preview_items.length)

    for (let i = 0; i < preview_items.length; i++) {
        let item = preview_items[i];
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

    function animate() {
        console.log('animate')
        if (currentItemIndex >= preview_items.length) return;
        let item = preview_items[currentItemIndex];
        let animIndex = currentItemIndex;
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
        let startX = offsetX; // 使用 offsetX 作为起始位置
        let currentX = startX;

        // 使用 requestAnimationFrame 实现动画逐渐变慢
        function move() {
            currentX = lerp(currentX, targetX, speed);
            item.style.transform = `translateX(${currentX}px)`;

            // 计算透明度，根据 currentX 的位置进行变化
            const progress = (currentX - startX) / (targetX - startX); // 从 0 到 1
            item.style.opacity = progress; // 透明度逐渐从 0 增加到 1

            let overHalf = false;
            if (startX > targetX) {
                overHalf = currentX < (startX + targetX) / 2;
            }
            else {
                overHalf = currentX > (startX + targetX) / 2;
            }

            console.log(overHalf)

            // 当当前位置达到一半时，启动下一个item的动画
            if (overHalf) {
                if (currentItemIndex === animIndex) {
                    currentItemIndex++;
                    console.log("start next animate")
                    animate(); // 启动下一个item的动画
                }
            }

            // 检查是否接近目标位置，避免无限接近
            if (Math.abs(currentX - targetX) > 0.1) {
                requestAnimationFrame(move);
            }
        }

        move();
    }

// 启动第一个元素的动画
    animate();


})()
