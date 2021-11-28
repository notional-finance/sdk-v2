// prettier-ignore
import {
  ApolloClient, NormalizedCacheObject, InMemoryCache, HttpLink, from, DocumentNode,
} from '@apollo/client/core';
import {onError} from '@apollo/client/link/error';
import {RetryLink} from '@apollo/client/link/retry';
import fetch from 'cross-fetch';

export default class GraphClient {
  public apollo: ApolloClient<NormalizedCacheObject>;

  constructor(public graphHttpEndpoint: string, public pollInterval: number) {
    const errorLink = onError(({graphQLErrors, networkError}) => {
      if (graphQLErrors) {
        graphQLErrors.forEach(({message, locations, path}) => {
          console.log(`[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`);
        });
      }
      if (networkError) console.log(`[Network error]: ${networkError}`);
    });
    const retryLink = new RetryLink();
    const httpLink = new HttpLink({uri: graphHttpEndpoint, fetch});

    this.apollo = new ApolloClient<NormalizedCacheObject>({
      uri: graphHttpEndpoint,
      cache: new InMemoryCache(),
      link: from([errorLink, retryLink, httpLink]),
    });
  }

  public async queryOrThrow<T>(query: DocumentNode, variables?: Object) {
    const result = await this.apollo.query<T>({query, fetchPolicy: 'network-only', variables});
    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.data;
  }
}
