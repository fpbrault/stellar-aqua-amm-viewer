/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import dynamic from "next/dynamic";
const ApexCharts = dynamic(() => import("react-apexcharts"), { ssr: false });

type MyProps = { data: any[] };
type MyState = { options: any; series: any };

class VoteChart extends React.Component<MyProps, MyState> {
  constructor(props: MyProps | Readonly<MyProps>) {
    super(props);
    const seriesData = props.data.map((item: { data: { percent: number } }) => {
      return item.data.percent.toFixed(2);
    });
    const categories = props.data.map((item: { name: string }) => {
      return item.name;
    });

    this.state = {
      series: [
        {
          name: "Votes by unlock date",
          data: seriesData
        }
      ],
      options: {
        chart: {
          type: "area"
        },
        dataLabels: {
          enabled: true,
          formatter: function (val: string) {
            return val + "%";
          }
        },
        stroke: {
          curve: "smooth"
        },
        xaxis: {
          categories: categories
        },
        yaxis: {
          min: 0,
          max: 100,
          labels: {
            formatter: function (y: number) {
              return y.toFixed(0) + "%";
            }
          },
          title: {
            text: "unlocked votes"
          }
        }
      }
    };
  }

  render() {
    return (
      <>
        <div className="flex flex-col justify-center mixed-chart">
          <div className="w-[90vw] md:h-[50vh] h-[80vh] mx-auto my-2 text-black bg-white rounded-lg shadow-2xl md:max-w-4xl">
            <div className="w-full h-full">
              <ApexCharts
                options={this.state.options}
                series={this.state.series}
                type="area"
                height="100%"
                width="100%"
              />
            </div>
          </div>
        </div>
      </>
    );
  }
}

export default VoteChart;
