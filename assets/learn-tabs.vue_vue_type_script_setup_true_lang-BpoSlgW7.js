import{j as r,E as u,F as p}from"./index-B8THJDgn.js";import{l as d,L as o,i as s,F as f,Q as m,f as _,y as g,g as k,U as y,j as b,X as h}from"./chess-board-CKnImvKx.js";/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const x=r("compass",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z",key:"9ktpf1"}]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const v=r("graduation-cap",[["path",{d:"M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z",key:"j76jl0"}],["path",{d:"M22 10v6",key:"1lu8f3"}],["path",{d:"M6 12.5V16a6 3 0 0 0 12 0v-3.5",key:"1r8lef"}]]),C={class:"flex gap-1 rounded-full bg-surface-mid p-1"},L=["aria-current","onClick"],V=d({__name:"learn-tabs",setup(j){const n=u(),c=p(),i=[{label:"課程",to:"/learn",icon:v},{label:"概念",to:"/learn/concepts",icon:x}];function t(a){return a==="/learn/concepts"?n.path==="/learn/concepts":n.path==="/learn"}function l(a){t(a)||c.push(a)}return(a,z)=>(o(),s("div",C,[(o(),s(f,null,m(i,e=>_("button",{key:e.to,type:"button",class:g(["flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-full py-2 font-sans text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",t(e.to)?"bg-surface-card text-primary-dark shadow-[0_1px_4px_rgba(61,34,16,0.14)]":"text-ink-muted"]),"aria-current":t(e.to)?"page":void 0,onClick:B=>l(e.to)},[(o(),k(y(e.icon),{size:16,"stroke-width":2,"aria-hidden":"true"})),b(h(e.label),1)],10,L)),64))]))}});export{V as _};
