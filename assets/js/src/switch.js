function initPageTransitions() {
    const overlay = document.querySelector('.page-transition-overlay');

    // 初始页面加载时隐藏遮罩
    function hideOverlay() {
        setTimeout(() => {
            overlay.classList.add('hidden');
        }, 50);
    }


    // 处理所有导航事件（包括后退/前进）
    function handleNavigation(targetUrl) {
        overlay.classList.remove('hidden');

        setTimeout(function() {
            window.location = targetUrl;
        }, 300);
    }

    // 监听浏览器后退/前进
    window.addEventListener('popstate', function(event) {
        const targetUrl = event.state?.url || window.location.href;
        handleNavigation(targetUrl);
    });

    // 处理点击链接导航时保存状态
    document.addEventListener('click', function(e) {
        const link = e.target.closest('a');
        
        if (link && !link.classList.contains('nav-icon') && !link.target && link.href.startsWith(window.location.origin)) {
            const currentPath = window.location.pathname;
            const targetPath = new URL(link.href).pathname;
            
            if (currentPath !== targetPath) {
                e.preventDefault();
                history.pushState({ url: link.href }, '', link.href);
                handleNavigation(link.href);
            }
        }
    });
    window.addEventListener('DOMContentLoaded', hideOverlay);
}

document.addEventListener('DOMContentLoaded', initPageTransitions);