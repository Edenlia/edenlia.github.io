(function() {
    var $ = document.querySelector.bind(document),
        $$ = document.querySelectorAll.bind(document)


    const preview_items = $$('.preview-item')
    const targetX = 300; // 目标位置（可以根据需要调整）
    let currentItemIndex = 0; // 当前动画中的元素索引
    const speed = 0.05;

    function lerp(start, end, t) {
        return start + (end - start) * t;
    }

    function animate() {
        console.log('animate')
        let item = preview_items[currentItemIndex];

        console.log(item)

        let startX = 0;
        let currentX = startX;

        // 使用 requestAnimationFrame 实现动画逐渐变慢
        function move() {
            currentX = lerp(currentX, targetX, speed);
            item.style.transform = `translateX(${currentX}px)`;

            // 检查是否接近目标位置，避免无限接近
            if (Math.abs(currentX - targetX) > 0.1) {
                requestAnimationFrame(move);
            } else {
                // 到达目标位置后，开始下一个元素的动画
                currentItemIndex++;
                if (currentItemIndex < preview_items.length) {
                    animate();
                }
            }
        }

        move();
    }

    animate();


})()
