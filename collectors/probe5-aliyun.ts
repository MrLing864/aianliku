import { discoverAliyunListItems } from "./lib/aliyun";

discoverAliyunListItems()
  .then((items) => {
    console.log("TOTAL_UNIQUE:", items.length);
    items.forEach((i) => console.log(`- ${i.companyName} | ${i.sourceUrl}`));
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
