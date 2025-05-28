#!/bin/bash

# 获取所有远程标签
echo "正在获取远程标签..."
remote_tags=$(git ls-remote --tags origin | grep -v '{}' | cut -d'/' -f3)

# 检查是否有标签
if [ -z "$remote_tags" ]; then
  echo "没有找到远程标签。"
  exit 0
fi

# 显示将要删除的标签
echo "将要删除以下远程标签:"
echo "$remote_tags"

# 确认删除
read -p "确定要删除这些标签吗？(y/n): " confirm
if [ "$confirm" != "y" ]; then
  echo "操作已取消。"
  exit 0
fi

# 删除远程标签
echo "正在删除远程标签..."
for tag in $remote_tags; do
  echo "删除标签: $tag"
  git push origin --delete "$tag"
done

# 删除本地标签
echo "正在删除本地标签..."
git tag | xargs git tag -d

echo "所有标签已成功删除。"