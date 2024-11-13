function initPageTransitions() {
    const overlay = document.querySelector('.page-transition-overlay');

    // 页面加载后淡出
    requestAnimationFrame(() => {
        setTimeout(() => {
            overlay.classList.add('hidden');
        }, 50);
    });

    // 处理所有内部链接点击
    document.addEventListener('click', function(e) {
        const link = e.target.closest('a');
        if (link && !link.target && link.href.startsWith(window.location.origin)) {
            e.preventDefault();

            // 移除 hidden 类来显示遮罩
            overlay.classList.remove('hidden');

            setTimeout(function() {
                window.location = link.href;
            }, 300);
        }
    });
}

// 确保尽早初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPageTransitions);
} else {
    initPageTransitions();
}