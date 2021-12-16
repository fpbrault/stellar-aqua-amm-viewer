import type { NextPage } from "next";
import Rewards from "../components/Rewards";
import Layout from "../components/Layout";

const Home: NextPage = () => {
  return (
    <Layout pageTitle="AMM AQUA Rewards viewer">
      <div data-theme="stellar" className="bg-base-200">
        <Rewards />
      </div>
    </Layout>
  );
};

export default Home;
