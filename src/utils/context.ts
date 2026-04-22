export type PageContext = {
  params: Promise<unknown>;
  searchParams: Promise<unknown>;
};

export async function getAsyncPageContext(pageContext: PageContext) {
  return {
    params: await pageContext.params,
    searchParams: await pageContext.searchParams,
  };
}
