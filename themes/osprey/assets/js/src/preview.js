(function() {
    var $ = document.querySelector.bind(document),
        $$ = document.querySelectorAll.bind(document)

    const preview_row_1 = $('.preview-row-1')
    const preview_row_2 = $('.preview-row-2')
    const preview_row_3 = $('.preview-row-3')

    let real_preview_items = $$('.preview-item')

    console.log(real_preview_items.length)

    // 0 to real_preview_items.length - 1
    let indices = Array.from({length: real_preview_items.length}, (v, k) => k)

    // Shuffle the indices
    for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    for (let i = 0; i < indices.length; i++) {
        let index = indices[i]
        let item = real_preview_items[index]
        if (i % 3 === 0) {
            // first row need class "from-right"
            item.classList.add('from-right')
            preview_row_1.appendChild(item)
        }
        else if (i % 3 === 1) {
            // second row need class "from-left
            item.classList.add('from-left')
            preview_row_2.appendChild(item)
        }
        else {
            // third row need class "from-right"
            item.classList.add('from-right')
            preview_row_3.appendChild(item)
        }
    }

    // Reassign real_preview_items, make sure the sort is correct
    real_preview_items = $$('.preview-item')

    // After shuffling all real preview items, add preview placeholder items
    // Each row has 5 placeholders to make sure the real preview items are correct
    for (let i = 0; i < 5; i++) {
        let placeholder = document.createElement('div')
        placeholder.classList.add('preview-item', 'grid-16-9', 'from-right', 'placeholder')
        preview_row_1.appendChild(placeholder)
    }

    for (let i = 0; i < 5; i++) {
        let placeholder = document.createElement('div')
        placeholder.classList.add('preview-item', 'grid-16-9', 'from-left', 'placeholder')
        preview_row_2.appendChild(placeholder)
    }

    for (let i = 0; i < 5; i++) {
        let placeholder = document.createElement('div')
        placeholder.classList.add('preview-item', 'grid-16-9', 'from-right', 'placeholder')
        preview_row_3.appendChild(placeholder)
    }

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


    function animate() {
        // console.log('animate')
        if (currentItemIndex >= real_preview_items.length) return;
        let item = real_preview_items[currentItemIndex];
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

            // console.log(overHalf)

            // 当当前位置达到一半时，启动下一个item的动画
            if (overHalf) {
                if (currentItemIndex === animIndex) {
                    currentItemIndex++;
                    // console.log("start next animate")
                    animate(); // 启动下一个item的动画
                }
            }

            // 检查是否接近目标位置，避免无限接近
            if (Math.abs(currentX - targetX) > 0.1) {
                requestAnimationFrame(move);
            }
            else {
                // The last item finished animation
                // Start the main animation
                if (animIndex === real_preview_items.length - 1) {
                    animate_main();
                }

            }
        }

        move();
    }

// 启动第一个元素的动画
    animate();


})()
