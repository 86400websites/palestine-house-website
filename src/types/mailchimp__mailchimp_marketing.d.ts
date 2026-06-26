// Minimal ambient types for @mailchimp/mailchimp_marketing (the package ships
// no types). Declares only the surface src/lib/mailchimp/client.ts uses — an
// idempotent member upsert + a tag write — rather than pulling the full
// DefinitelyTyped package, keeping the dependency surface to the two SDKs S12
// adds. Signatures mirror the SDK's setConfig / lists.setListMember /
// lists.updateListMemberTags.
declare module "@mailchimp/mailchimp_marketing" {
  interface SetConfigOptions {
    apiKey?: string;
    accessToken?: string;
    server?: string;
  }

  type SubscriberStatus =
    | "subscribed"
    | "unsubscribed"
    | "cleaned"
    | "pending"
    | "transactional";

  interface SetListMemberBody {
    email_address: string;
    status_if_new?: SubscriberStatus;
    status?: SubscriberStatus;
    merge_fields?: Record<string, unknown>;
  }

  interface MemberTag {
    name: string;
    status: "active" | "inactive";
  }

  interface UpdateListMemberTagsBody {
    tags: MemberTag[];
  }

  interface ListsApi {
    setListMember(
      listId: string,
      subscriberHash: string,
      body: SetListMemberBody,
      options?: { skipMergeValidation?: boolean },
    ): Promise<unknown>;
    updateListMemberTags(
      listId: string,
      subscriberHash: string,
      body: UpdateListMemberTagsBody,
    ): Promise<unknown>;
  }

  interface MailchimpMarketing {
    setConfig(config: SetConfigOptions): void;
    lists: ListsApi;
  }

  const mailchimp: MailchimpMarketing;
  export default mailchimp;
}
