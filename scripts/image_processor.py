from PIL import Image
import os


def merge_images():
    # 获取当前脚本的目录
    script_dir = os.path.dirname(os.path.abspath(__file__))
    # 获取项目根目录
    project_dir = os.path.dirname(script_dir)

    # 构建图片路径
    overlay_path = os.path.join(project_dir, 'static', 'images', 'GKART.png')
    background_path = os.path.join(project_dir, 'static', 'images', 'GKART', 'GKART_leisure.png')

    # 打开图片
    overlay = Image.open(overlay_path)
    background = Image.open(background_path)

    # 放大 GKART 图片 (比如放大 1.33 倍)
    scale = 1.2
    new_size = (int(overlay.width * scale), int(overlay.height * scale))
    overlay = overlay.resize(new_size, Image.Resampling.LANCZOS)

    # 确保背景图片是 RGBA 模式
    if background.mode != 'RGBA':
        background = background.convert('RGBA')

    # 计算居中位置
    x = (background.width - overlay.width) // 2
    y = (background.height - overlay.height) // 2

    # 创建半透明白色遮罩并应用到背景图片
    white_overlay = Image.new('RGBA', background.size, (255, 255, 255, 77))  # 77 是透明度 (0-255)
    background_with_overlay = Image.alpha_composite(background, white_overlay)

    # 创建最终结果图片
    result = Image.new('RGBA', background.size)

    # 先粘贴带遮罩的背景
    result.paste(background_with_overlay, (0, 0))

    # 最后粘贴 GKART 图片
    result.paste(overlay, (x, y), overlay)

    # 保存结果
    output_path = os.path.join(project_dir, 'static', 'images', 'GKART', 'merged_GKART.png')
    result.save(output_path, 'PNG')


if __name__ == '__main__':
    merge_images()