import { currentDate, splitDate } from "@/utils";

const weekDays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
const CREATOR = "wangjunneil@gmail.com";

async function uploadFileToQiniu(file) {
  const tokenRes = await fetch("/api/qiniu", { cache: "no-cache" });
  if (tokenRes.status === 401) throw new Error("UNAUTHORIZED");
  if (!tokenRes.ok) throw new Error("获取上传 token 失败");
  const { token } = await tokenRes.json();

  const formData = new FormData();
  formData.append("token", token);
  formData.append("key", `wangjundev/timeline/${currentDate()}/${file.name}`);
  formData.append("file", file);

  const uploadRes = await fetch("https://upload.qiniup.com", {
    method: "POST",
    body: formData,
  });
  if (!uploadRes.ok) throw new Error("上传文件失败");
  const res = await uploadRes.json();
  return { status: "done", response: { key: res.key } };
}

export async function submitTimeline({ content, files = [], geo = {}, weather = {} }) {
  const check = await fetch("/api/auth/check", { cache: "no-cache" });
  if (check.status === 401) throw new Error("UNAUTHORIZED");

  const photos = [];
  for (const f of files) {
    photos.push(await uploadFileToQiniu(f));
  }

  const [year, month, day] = splitDate();
  const dayOfWeek = new Date(`${year}-${month}-${day}`).getDay();

  const payload = {
    year,
    month,
    day,
    week: weekDays[dayOfWeek],
    weather,
    content,
    photos,
    creator: CREATOR,
    extends: { geo: geo || {} },
  };

  const res = await fetch("/api/timeline", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (res.status === 401) throw new Error("UNAUTHORIZED");
  if (!res.ok) throw new Error("保存失败");
  return res.json();
}
