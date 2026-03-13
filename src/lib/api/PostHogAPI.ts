import type { AstroCookies } from "astro";
import type { PostHog } from "posthog-node";

export class PosthogAPI {
  private _distinctId?: string;
  private cookies: AstroCookies;
  private client: PostHog;

  constructor(cookies: AstroCookies, client: PostHog, distinctId?: string) {
    this.cookies = cookies;
    this.client = client;
    this._distinctId = distinctId || this.distinctIdFromCookie;
  }

  private get distinctIdFromCookie(): string | undefined {
    return this.cookies.get("posthog_distinct_id")?.value;
  }

  public get distinctId(): string {
    if (!this._distinctId || !this.distinctIdFromCookie) {
      throw new Error("Distinct ID is not set");
    }

    return this._distinctId || this.distinctIdFromCookie;
  }

  public set distinctId(value: string) {
    this._distinctId = value;
  }

  public async getFeatureFlag(
    flag: string,
  ): Promise<string | boolean | undefined> {
    return this.client.getFeatureFlag(flag, this.distinctId);
  }

  public async isFeatureFlagEnabled(flag: string): Promise<boolean> {
    const featureFlagValue = await this.getFeatureFlag(flag);
    return featureFlagValue !== "control";
  }

  public async capture(
    event: string,
    properties: Record<string, unknown>,
  ): Promise<void> {
    this.client.capture({
      distinctId: this.distinctId,
      event,
      properties,
    });

    await this.client.flush();
  }
}
