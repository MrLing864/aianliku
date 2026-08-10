/** 把任意结构化数据对象渲染成 <script type="application/ld+json">。 */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      // 结构化数据是服务端生成的静态内容，无用户输入，可安全直出
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
