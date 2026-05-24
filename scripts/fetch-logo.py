import re
import urllib.request

html = urllib.request.urlopen("https://vuphong.com", timeout=15).read().decode("utf-8", "ignore")
urls = set(re.findall(r'https?://[^"\']+(?:logo|Logo|mat-troi|MatTroi)[^"\']*\.(?:png|jpg|svg|webp)', html))
for u in sorted(urls):
    print(u)
