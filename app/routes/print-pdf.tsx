import type { LoaderFunctionArgs } from "@remix-run/server-runtime";
import puppeteer from "puppeteer";

const saveAsPdf = async (url: string, cookie: string | null) => {
  const browser = await puppeteer.launch({
    executablePath: "/usr/bin/google-chrome",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  if (cookie) {
    await page.setExtraHTTPHeaders({
      Cookie: cookie,
      Connection: "keep-alive",
    });
  }
  await page.goto(url, {
    waitUntil: "networkidle0",
  });

  const result = await page.pdf({
    format: "a4",
  });

  await browser.close();

  return result;
};

export async function loader({ request }: LoaderFunctionArgs) {
  const cookie = request.headers.get("Cookie");

  const url = new URL(request.url);

  const deliveryId = url.searchParams.get("deliveryId");

  const pdf = await saveAsPdf(`${url.origin}/deliveries/${deliveryId}`, cookie);

  const headers = new Headers({ "Content-Type": "application/pdf" });
  return new Response(pdf, { status: 200, headers });
}
