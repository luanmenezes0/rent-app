import type { LoaderFunctionArgs } from "react-router";
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
    landscape: false,
    margin: {
      top: "10mm",
      bottom: "10mm",
      left: "10mm",
      right: "10mm",
    },
    printBackground: true,
  });

  await browser.close();

  return result;
};

export async function loader({ request }: LoaderFunctionArgs) {
  const cookie = request.headers.get("Cookie");

  const url = new URL(request.url);

  const deliveryId = url.searchParams.get("deliveryId");
  const budgetId = url.searchParams.get("budgetId");

  let pdfUrl: string;
  if (deliveryId) {
    pdfUrl = `${url.origin}/deliveries/${deliveryId}`;
  } else if (budgetId) {
    pdfUrl = `${url.origin}/budgets/${budgetId}/print`;
  } else {
    throw new Error("Either deliveryId or budgetId is required");
  }

  const pdf = await saveAsPdf(pdfUrl, cookie);

  const headers = new Headers({ "Content-Type": "application/pdf" });
  return new Response(pdf, { status: 200, headers });
}
