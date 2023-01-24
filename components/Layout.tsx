import React, { ReactNode } from "react";
import Head from "next/head";

type Props = {
  children: ReactNode;
  pageTitle: string;
  fullpage?: boolean;
};

const Layout: React.FC<Props> = (props) => (
  <>
    <Head>
      <meta charSet="utf-8" />
      <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
      <meta
        name="viewport"
        content="width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1,user-scalable=no"
      />
      <meta name="description" content="AMM AQUA rewards viewer" />
      <meta name="keywords" content="Keywords" />
      <title>{props.pageTitle}</title>

      <meta property="og:url" content="https://amm.stellar.beign.es/" />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={props.pageTitle} key="ogtitle" />
      <meta property="og:description" content="AMM AQUA rewards viewer" key="ogdesc" />
      {/*       <meta
        property="og:image"
        content="https://upload.wikimedia.org/wikipedia/commons/5/56/Stellar_Symbol.png"
      /> */}
      <meta property="twitter:domain" content="amm.stellar.beign.es" />
      <meta property="twitter:url" content="https://amm.stellar.beign.es/" />
      {/*       <meta
        name="twitter:image"
        content="https://upload.wikimedia.org/wikipedia/commons/5/56/Stellar_Symbol.png"
      /> */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={props.pageTitle} />
      <meta name="twitter:description" content="AMM AQUA rewards viewer" />
      <link href="/favicon-16x16.png" rel="icon" type="image/png" sizes="16x16" />
      <link href="/favicon-32x32.png" rel="icon" type="image/png" sizes="32x32" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="manifest" href="/site.webmanifest" />
      <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#5bbad5" />
      <meta name="msapplication-TileColor" content="#da532c" />
      <meta name="theme-color" content="#9b3eff" />
      <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" />
    </Head>
    <div className="flex flex-col text-neutral bg-base-200">
      <div className="min-h-screen pt-0">{props.children}</div>
    </div>
  </>
);

export default Layout;
