function initPageTransitions() {
    const overlay = document.querySelector('.page-transition-overlay');

    // 页面加载后淡出
    requestAnimationFrame(() => {
        setTimeout(() => {
            overlay.classList.add('hidden');
        }, 50);
    });

    // 只处理导航链接的点击
    document.addEventListener('click', function(e) {
        const link = e.target.closest('a');

        // 检查是否是导航链接（通过比较当前路径和目标路径）
        if (link && !link.classList.contains('nav-icon') && !link.target && link.href.startsWith(window.location.origin)) {
            const currentPath = window.location.pathname;
            const targetPath = new URL(link.href).pathname;

            // 只有当目标路径与当前路径不同时才触发过渡
            if (currentPath !== targetPath) {
                e.preventDefault();
                isCurrentPage = false;

                // 显示过渡遮罩
                overlay.classList.remove('hidden');

                setTimeout(function() {
                    window.location = link.href;
                }, 300);
            }
        }
    });
}

// 确保尽早初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPageTransitions);
} else {
    initPageTransitions();
}