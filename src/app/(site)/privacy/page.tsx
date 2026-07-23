import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "隐私政策",
  robots: { index: true, follow: true },
};
export default function PrivacyPage() {
  return (
    <main className="container-page py-14 lg:py-20">
      <article className="prose-policy mx-auto max-w-3xl">
        <p className="text-xs font-semibold text-primary">
          更新于 2026 年 7 月 19 日
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">隐私政策</h1>
        <p className="mt-6 leading-8 text-muted-foreground">
          AI案例库遵循最少必要原则处理个人信息。本政策说明企业体检、报告领取、专家预约和联系表单中的信息如何被使用。
        </p>
        {[
          {
            title: "我们收集什么",
            text: "可能包括手机号、姓名、企业、微信，以及你主动填写的业务流程、成本、预算、现有系统和需求信息。普通访客无需注册。",
          },
          {
            title: "为什么使用",
            text: "用于生成企业 AI 体检报告、管理私密报告、回复请求、安排专家回访，以及改进产品体验。不会将联系方式出售给第三方。",
          },
          {
            title: "AI 服务商处理",
            text: "体检内容可能发送给 DeepSeek 以生成建议。平台通过服务端调用并尽量减少可识别个人的信息；请勿在问诊中填写商业秘密、身份证号、健康信息或未经授权的个人信息。",
          },
          {
            title: "第三方服务与数据位置",
            text: "网站部署使用腾讯云 EdgeOne Pages，数据存储使用 MongoDB Atlas 和 EdgeOne Makers Blob 对象存储。不同服务的处理地区可能不同；正式运营前将根据实际部署完成数据流评估、必要告知和授权，无法满足要求时会阻止相关数据提交或改用合适服务。",
          },
          {
            title: "报告通知与产品更新",
            text: "生成报告本身与营销订阅相互独立。产品和案例更新默认不订阅，只有你主动勾选时才会记录同意，并可随时联系我们退订。",
          },
          {
            title: "保存与安全",
            text: "问诊和报告持续保存至你主动删除；报告使用不可猜测的私密链接且禁止搜索引擎收录。来源快照仅后台可见。",
          },
          {
            title: "你的权利",
            text: "你可以申请查阅、更正、导出或删除信息。报告页提供删除入口，也可以通过 hello@aianliku.cn 联系我们。",
          },
        ].map((item) => (
          <section key={item.title} className="mt-10 border-t pt-7">
            <h2 className="text-xl font-semibold">{item.title}</h2>
            <p className="mt-3 leading-8 text-muted-foreground">{item.text}</p>
          </section>
        ))}
      </article>
    </main>
  );
}
