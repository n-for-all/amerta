"use client";
import React, { useEffect, useRef, useState } from "react";
import Highlight from "react-highlight";
import "highlight.js/styles/atom-one-dark.css";

const LockedPanel = () => {
  return (
    <>
      <div className="relative w-full">
        <div className="w-full bg-zinc-200/50 p-10 text-center rounded-sm min-h-[350px] flex flex-col items-center justify-center">
          <div className="flex items-center justify-start w-full h-10 -space-x-3 md:justify-center">
            <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 border-4 rounded-full border-zinc-200 bg-gradient-to-br from-zinc-800 to-black">
              <svg className="w-4 h-4 text-white fill-current" viewBox="0 0 108 156" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M31.683 77.217h44.634l30.9 53.218H.783l30.9-53.218Z" fill="currentColor" />
                <path fillRule="evenodd" clipRule="evenodd" d="M41.478 108.522h21.913v46.956H41.478v-46.956ZM7.043 78.782 52.633.523l46.758 78.26H7.043Z" fill="currentColor" />
              </svg>
            </div>
          </div>
          <h3 className="w-full mt-3 text-base font-medium text-left text-zinc-900 md:text-center">Signup for a Free Account</h3>
          <p className="mx-auto mt-2 text-base text-left text-zinc-500 md:max-w-md md:text-center">Signup for a free account to gain access to the first two templates of each marketing section.</p>
          <div className="relative flex items-center justify-start w-full space-x-5 md:justify-center">
            <button className="flex items-center group cursor-pointer mt-5 ring-2 ring-zinc-200 ease-out duration-200 hover:ring-[3px] hover:ring-zinc-200 text-zinc-600 hover:text-zinc-900 leading-none bg-zinc-50 hover:bg-white rounded-sm px-4 text-sm font-semibold py-2.5">
              <svg className="mr-1.5 -lm-1 w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Signup</span>
            </button>
            <button className="flex items-center group cursor-pointer mt-5 ring-2 ring-zinc-200 ease-out duration-200 hover:ring-[3px] hover:ring-zinc-200 text-zinc-600 hover:text-zinc-900 leading-none bg-zinc-50 hover:bg-white rounded-sm px-4 text-sm font-semibold py-2.5">
              <svg className="mr-1.5 -lm-1 w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
              <span>Login</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

const CodeViewer = ({ code }: { code: string }) => {
  const tabHandle = useRef<HTMLDivElement | null>(null);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [copied, setCopied] = useState(false);

  const tabs = [
    {
      name: "Preview",
      type: "image",
      value: "https://cdn.devdojo.com/images/components/headers/header-01.jpg",
      locked: false,
    },
    {
      name: "Html",
      type: "code",
      value: code,
      locked: true,
    },
    {
      name: "Shopify",
      type: "code",
      value: code,
      locked: false,
    },
  ];

  const handleSwitch = (index) => {
    setActiveTab(index);
    if (tabHandle.current && refs.current[index]) {
      tabHandle.current.style.left = refs.current[index].offsetLeft + "px";
      tabHandle.current.style.width = refs.current[index].offsetWidth + "px";
    }
  };

  const handleCopy = (e) => {
    e.preventDefault();
    if (!tabs[activeTab]) return;
    navigator.clipboard.writeText(tabs[activeTab].value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    handleSwitch(0);
  }, []);

  const createTab = (tab, index) => {
    if (tab.locked) {
      return (
        <div key={index} className="relative inset-0 w-full h-auto border min-h-[250px] border-zinc-200 rounded-sm shadow-sm cursor-text " style={{ display: activeTab === index ? "block" : "none" }}>
          <LockedPanel />
        </div>
      );
    }
    switch (tab.type) {
      case "image":
        return (
          <div
            key={index}
            className="relative w-full overflow-hidden bg-white bg-center bg-cover border rounded-sm border-neutral-200 aspect-video"
            style={{
              backgroundImage: "url(https://cdn.devdojo.com/images/components/headers/header-01.jpg)",
              display: activeTab === index ? "block" : "none",
            }}
          >
            <img src={tab.value} alt={tab.name} className="object-cover w-full h-full" />
          </div>
        );
      case "code":
        return (
          <div key={index} className="relative inset-0 w-full h-auto border min-h-[500px] border-zinc-100 rounded-sm shadow-sm cursor-text text-xs overflow-hidden" style={{ display: activeTab === index ? "block" : "none" }}>
            <Highlight className="absolute w-full h-full overflow-auto html">{tab.value}</Highlight>
          </div>
        );
      default:
        return (
          <div key={index} className="relative inset-0 w-full h-auto border min-h-[250px] border-zinc-100 rounded-sm shadow-sm cursor-text " style={{ display: activeTab === index ? "block" : "none" }}>
            <pre>
              <code>{tab.value}</code>
            </pre>
          </div>
        );
    }
  };
  return (
    <div className="relative z-10 w-full mt-1 rounded-sm example">
      <div>
        <div className="relative z-10 flex items-center justify-between mb-3">
          <div className="p-1 rounded-sm select-none text-zinc-500 bg-zinc-100">
            <div className="relative flex items-center justify-center w-auto h-8">
              {tabs.map((tab, index) => (
                <button
                  ref={(ref) => {
                    refs.current[index] = ref;
                  }}
                  key={index}
                  type="button"
                  onClick={() => handleSwitch(index)}
                  className="relative z-20 inline-flex items-center justify-center flex-1 h-8 px-3 text-sm font-medium transition-all rounded-sm cursor-pointer whitespace-nowrap ring-offset-background"
                >
                  {tab.name}
                </button>
              ))}
              <div ref={tabHandle} className="absolute top-0 left-0 z-10 h-8 duration-300 ease-out" style={{ width: 0 }}>
                <div className="w-full h-full bg-white rounded-sm shadow-sm" />
              </div>
            </div>
          </div>

          <div className="relative flex items-center space-x-1">
            <div className="relative flex items-center space-x-1">
              <div className={"relative z-20 flex items-center"}>
                <div className="absolute left-0" style={{ display: copied ? "block" : "none" }}>
                  <div className="px-3 h-7 -ml-0.5 items-center flex text-xs bg-green-500 border-r border-green-500 -translate-x-full text-white rounded">
                    <span>Copied!</span>
                    <div className="absolute right-0 inline-block h-full -mt-px overflow-hidden translate-x-3 -translate-y-2 top-1/2">
                      <div className="w-3 h-3 origin-top-left transform rotate-45 bg-green-500 border border-transparent" />
                    </div>
                  </div>
                </div>
                <button onClick={tabs[activeTab] && tabs[activeTab].type === "code" && !tabs[activeTab].locked ? handleCopy : undefined} className={"flex items-center justify-center h-8 text-xs rounded-sm cursor-pointer w-9 hover:bg-zinc-50 active:bg-zinc-100 text-neutral-400 hover:text-neutral-700 group " + (tabs[activeTab] && tabs[activeTab].type === "code" && !tabs[activeTab].locked ? "opacity-100" : "opacity-30 cursor-not-allowed")}>
                  <svg className="w-4 h-4 stroke-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="relative z-20 flex items-center justify-center w-full">{tabs.map((tab, index) => createTab(tab, index))}</div>
    </div>
  );
};

export { CodeViewer };
