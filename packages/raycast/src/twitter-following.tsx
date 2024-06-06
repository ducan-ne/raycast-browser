import { List } from "@raycast/api";
import { usePromise } from "@raycast/utils";
import { browser } from "raycast-browser/node";
import { useState } from "react";
import assert from "node:assert";

export default function TwitterFollowing() {
  const [isLoading, setIsLoading] = useState(false);
  const following = usePromise(async () => {
    const cookies = await browser.cookies.getAll({ domain: "twitter.com" });
    const authToken = cookies.find((c) => c.name === "ct0")?.value;
    assert(authToken, "auth_token cookie not found");
    return browser.executeScriptCurrentTab(
      async (authToken) => {
        const res = await fetch(
          "https://twitter.com/i/api/graphql/ZxuX4tC6kWz9M8pe1i-Gdg/Following?variables=%7B%22userId%22%3A%22997800927938596865%22%2C%22count%22%3A20%2C%22includePromotedContent%22%3Afalse%7D&features=%7B%22rweb_tipjar_consumption_enabled%22%3Atrue%2C%22responsive_web_graphql_exclude_directive_enabled%22%3Atrue%2C%22verified_phone_label_enabled%22%3Afalse%2C%22creator_subscriptions_tweet_preview_api_enabled%22%3Atrue%2C%22responsive_web_graphql_timeline_navigation_enabled%22%3Atrue%2C%22responsive_web_graphql_skip_user_profile_image_extensions_enabled%22%3Afalse%2C%22communities_web_enable_tweet_community_results_fetch%22%3Atrue%2C%22c9s_tweet_anatomy_moderator_badge_enabled%22%3Atrue%2C%22articles_preview_enabled%22%3Afalse%2C%22tweetypie_unmention_optimization_enabled%22%3Atrue%2C%22responsive_web_edit_tweet_api_enabled%22%3Atrue%2C%22graphql_is_translatable_rweb_tweet_is_translatable_enabled%22%3Atrue%2C%22view_counts_everywhere_api_enabled%22%3Atrue%2C%22longform_notetweets_consumption_enabled%22%3Atrue%2C%22responsive_web_twitter_article_tweet_consumption_enabled%22%3Atrue%2C%22tweet_awards_web_tipping_enabled%22%3Afalse%2C%22creator_subscriptions_quote_tweet_preview_enabled%22%3Afalse%2C%22freedom_of_speech_not_reach_fetch_enabled%22%3Atrue%2C%22standardized_nudges_misinfo%22%3Atrue%2C%22tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled%22%3Atrue%2C%22tweet_with_visibility_results_prefer_gql_media_interstitial_enabled%22%3Afalse%2C%22rweb_video_timestamps_enabled%22%3Atrue%2C%22longform_notetweets_rich_text_read_enabled%22%3Atrue%2C%22longform_notetweets_inline_media_enabled%22%3Atrue%2C%22responsive_web_enhance_cards_enabled%22%3Afalse%7D",
          {
            headers: {
              authorization: "Bearer x",
              "x-csrf-token": authToken,
              "x-twitter-active-user": "yes",
              "x-twitter-auth-type": "OAuth2Session",
              "x-twitter-client-language": "en",
            },
          },
        );
        return await res.json();
      },
      [authToken],
    );
  });
  const list =
    following.data?.data?.user?.result?.timeline?.timeline?.instructions
      .map((i) => {
        if (!i.entries) return [];
        return i.entries
          .filter((item) => item.content.itemContent)
          .map((item) => {
            return item.content.itemContent.user_results.result.legacy;
          });
      })
      .flat();

  return (
    <List isLoading={following.isLoading}>
      {list?.map((user) => {
        return (
          <List.Item
            icon={user.profile_image_url_https}
            key={user.id}
            title={user.name}
          />
        );
      })}
    </List>
  );
}
