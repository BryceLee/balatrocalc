(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=globalThis,t=e=>e,n=e.trustedTypes,r=n?n.createPolicy(`lit-html`,{createHTML:e=>e}):void 0,i=`$lit$`,a=`lit$${Math.random().toFixed(9).slice(2)}$`,o=`?`+a,s=`<${o}>`,c=document,l=()=>c.createComment(``),u=e=>e===null||typeof e!=`object`&&typeof e!=`function`,d=Array.isArray,f=e=>d(e)||typeof e?.[Symbol.iterator]==`function`,p=`[ 	
\f\r]`,m=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,h=/-->/g,g=/>/g,_=RegExp(`>|${p}(?:([^\\s"'>=/]+)(${p}*=${p}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,`g`),v=/'/g,y=/"/g,b=/^(?:script|style|textarea|title)$/i,x=(e=>(t,...n)=>({_$litType$:e,strings:t,values:n}))(1),S=Symbol.for(`lit-noChange`),C=Symbol.for(`lit-nothing`),ee=new WeakMap,w=c.createTreeWalker(c,129);function te(e,t){if(!d(e)||!e.hasOwnProperty(`raw`))throw Error(`invalid template strings array`);return r===void 0?t:r.createHTML(t)}var T=(e,t)=>{let n=e.length-1,r=[],o,c=t===2?`<svg>`:t===3?`<math>`:``,l=m;for(let t=0;t<n;t++){let n=e[t],u,d,f=-1,p=0;for(;p<n.length&&(l.lastIndex=p,d=l.exec(n),d!==null);)p=l.lastIndex,l===m?d[1]===`!--`?l=h:d[1]===void 0?d[2]===void 0?d[3]!==void 0&&(l=_):(b.test(d[2])&&(o=RegExp(`</`+d[2],`g`)),l=_):l=g:l===_?d[0]===`>`?(l=o??m,f=-1):d[1]===void 0?f=-2:(f=l.lastIndex-d[2].length,u=d[1],l=d[3]===void 0?_:d[3]===`"`?y:v):l===y||l===v?l=_:l===h||l===g?l=m:(l=_,o=void 0);let x=l===_&&e[t+1].startsWith(`/>`)?` `:``;c+=l===m?n+s:f>=0?(r.push(u),n.slice(0,f)+i+n.slice(f)+a+x):n+a+(f===-2?t:x)}return[te(e,c+(e[n]||`<?>`)+(t===2?`</svg>`:t===3?`</math>`:``)),r]},ne=class e{constructor({strings:t,_$litType$:r},s){let c;this.parts=[];let u=0,d=0,f=t.length-1,p=this.parts,[m,h]=T(t,r);if(this.el=e.createElement(m,s),w.currentNode=this.el.content,r===2||r===3){let e=this.el.content.firstChild;e.replaceWith(...e.childNodes)}for(;(c=w.nextNode())!==null&&p.length<f;){if(c.nodeType===1){if(c.hasAttributes())for(let e of c.getAttributeNames())if(e.endsWith(i)){let t=h[d++],n=c.getAttribute(e).split(a),r=/([.?@])?(.*)/.exec(t);p.push({type:1,index:u,name:r[2],strings:n,ctor:r[1]===`.`?ie:r[1]===`?`?ae:r[1]===`@`?oe:O}),c.removeAttribute(e)}else e.startsWith(a)&&(p.push({type:6,index:u}),c.removeAttribute(e));if(b.test(c.tagName)){let e=c.textContent.split(a),t=e.length-1;if(t>0){c.textContent=n?n.emptyScript:``;for(let n=0;n<t;n++)c.append(e[n],l()),w.nextNode(),p.push({type:2,index:++u});c.append(e[t],l())}}}else if(c.nodeType===8)if(c.data===o)p.push({type:2,index:u});else{let e=-1;for(;(e=c.data.indexOf(a,e+1))!==-1;)p.push({type:7,index:u}),e+=a.length-1}u++}}static createElement(e,t){let n=c.createElement(`template`);return n.innerHTML=e,n}};function E(e,t,n=e,r){if(t===S)return t;let i=r===void 0?n._$Cl:n._$Co?.[r],a=u(t)?void 0:t._$litDirective$;return i?.constructor!==a&&(i?._$AO?.(!1),a===void 0?i=void 0:(i=new a(e),i._$AT(e,n,r)),r===void 0?n._$Cl=i:(n._$Co??=[])[r]=i),i!==void 0&&(t=E(e,i._$AS(e,t.values),i,r)),t}var re=class{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){let{el:{content:t},parts:n}=this._$AD,r=(e?.creationScope??c).importNode(t,!0);w.currentNode=r;let i=w.nextNode(),a=0,o=0,s=n[0];for(;s!==void 0;){if(a===s.index){let t;s.type===2?t=new D(i,i.nextSibling,this,e):s.type===1?t=new s.ctor(i,s.name,s.strings,this,e):s.type===6&&(t=new se(i,this,e)),this._$AV.push(t),s=n[++o]}a!==s?.index&&(i=w.nextNode(),a++)}return w.currentNode=c,r}p(e){let t=0;for(let n of this._$AV)n!==void 0&&(n.strings===void 0?n._$AI(e[t]):(n._$AI(e,n,t),t+=n.strings.length-2)),t++}},D=class e{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,n,r){this.type=2,this._$AH=C,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=n,this.options=r,this._$Cv=r?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode,t=this._$AM;return t!==void 0&&e?.nodeType===11&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=E(this,e,t),u(e)?e===C||e==null||e===``?(this._$AH!==C&&this._$AR(),this._$AH=C):e!==this._$AH&&e!==S&&this._(e):e._$litType$===void 0?e.nodeType===void 0?f(e)?this.k(e):this._(e):this.T(e):this.$(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==C&&u(this._$AH)?this._$AA.nextSibling.data=e:this.T(c.createTextNode(e)),this._$AH=e}$(e){let{values:t,_$litType$:n}=e,r=typeof n==`number`?this._$AC(e):(n.el===void 0&&(n.el=ne.createElement(te(n.h,n.h[0]),this.options)),n);if(this._$AH?._$AD===r)this._$AH.p(t);else{let e=new re(r,this),n=e.u(this.options);e.p(t),this.T(n),this._$AH=e}}_$AC(e){let t=ee.get(e.strings);return t===void 0&&ee.set(e.strings,t=new ne(e)),t}k(t){d(this._$AH)||(this._$AH=[],this._$AR());let n=this._$AH,r,i=0;for(let a of t)i===n.length?n.push(r=new e(this.O(l()),this.O(l()),this,this.options)):r=n[i],r._$AI(a),i++;i<n.length&&(this._$AR(r&&r._$AB.nextSibling,i),n.length=i)}_$AR(e=this._$AA.nextSibling,n){for(this._$AP?.(!1,!0,n);e!==this._$AB;){let n=t(e).nextSibling;t(e).remove(),e=n}}setConnected(e){this._$AM===void 0&&(this._$Cv=e,this._$AP?.(e))}},O=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,n,r,i){this.type=1,this._$AH=C,this._$AN=void 0,this.element=e,this.name=t,this._$AM=r,this.options=i,n.length>2||n[0]!==``||n[1]!==``?(this._$AH=Array(n.length-1).fill(new String),this.strings=n):this._$AH=C}_$AI(e,t=this,n,r){let i=this.strings,a=!1;if(i===void 0)e=E(this,e,t,0),a=!u(e)||e!==this._$AH&&e!==S,a&&(this._$AH=e);else{let r=e,o,s;for(e=i[0],o=0;o<i.length-1;o++)s=E(this,r[n+o],t,o),s===S&&(s=this._$AH[o]),a||=!u(s)||s!==this._$AH[o],s===C?e=C:e!==C&&(e+=(s??``)+i[o+1]),this._$AH[o]=s}a&&!r&&this.j(e)}j(e){e===C?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??``)}},ie=class extends O{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===C?void 0:e}},ae=class extends O{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==C)}},oe=class extends O{constructor(e,t,n,r,i){super(e,t,n,r,i),this.type=5}_$AI(e,t=this){if((e=E(this,e,t,0)??C)===S)return;let n=this._$AH,r=e===C&&n!==C||e.capture!==n.capture||e.once!==n.once||e.passive!==n.passive,i=e!==C&&(n===C||r);r&&this.element.removeEventListener(this.name,this,n),i&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){typeof this._$AH==`function`?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}},se=class{constructor(e,t,n){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=n}get _$AU(){return this._$AM._$AU}_$AI(e){E(this,e)}},ce=e.litHtmlPolyfillSupport;ce?.(ne,D),(e.litHtmlVersions??=[]).push(`3.3.2`);var le=(e,t,n)=>{let r=n?.renderBefore??t,i=r._$litPart$;if(i===void 0){let e=n?.renderBefore??null;r._$litPart$=i=new D(t.insertBefore(l(),e),e,void 0,n??{})}return i._$AI(e),i},ue=0;function de(){return ue++}var k=class extends HTMLElement{get[Symbol.toStringTag](){return this.tagName}#e;#t=0;constructor(){super(),this.#e=de()}connectedCallback(){this.isConnected&&this.render()}get uniqueId(){return this.#e}queueRender(){this.queueUpdate(()=>{this.renderIfIdle()})}queueUpdate(e){this.#t++,queueMicrotask(e)}renderIfIdle(){this.#t--,this.#t===0&&this.render()}render(){this.isConnected&&le(this.template(),this)}template(){return x``}},fe=class extends k{static{this.formAssociated=!0}#e=this.attachInternals();get labels(){return this.#e.labels}get form(){return this.#e.form}get shadowRoot(){return this.#e.shadowRoot}get type(){return this.tagName.toLowerCase()}get validationMessage(){return this.#e.validationMessage}get validity(){return this.#e.validity}get willValidate(){return this.#e.willValidate}checkValidity(){return this.#e.checkValidity()}reportValidity(){return this.#e.reportValidity()}setFormValue(...e){this.#e.setFormValue(...e)}},pe=await new CSSStyleSheet().replace(`
	combo-box {
		position: relative;
		display: block;
		inline-size: 100%;
		max-inline-size: 100%;
		block-size: 2rem;
	}

	.cb-button {
		anchor-name: var(--anchor-name);
		display: flex;
		justify-content: space-between;
		align-items: center;
		block-size: 100%;
		inline-size: 100%;
		padding: 0 0.25rem;
		border: 2px solid var(--c-border);
		border-radius: 0.25rem;
		color: var(--c-text);
		background-color: var(--c-background-lighter);
		text-align: left;
	}

	.cb-popover {
		position-anchor: var(--anchor-name);
		position: absolute;
		overflow: unset;
		inset-block-start: calc(anchor(end) + 0.25rem);
		inset-inline-start: anchor(start);
		margin: 0;
		padding: 0;
		border: none;
		background-color: transparent;
	}

	.cb-option-list {
		max-height: 15rem;
		display: flex;
		flex-direction: column;
		overflow-y: auto;
		margin-block-start: 0.25rem;
		border: 2px solid var(--c-border);
		border-radius: 0.5rem;
	}

	.cb-option-list > button {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.25rem;
		border: none;
		font: inherit;
		color: var(--c-text);
		background-color: var(--c-background-lighter);
		text-align: left;

		&:focus-visible {
			isolation: isolate;
		}

		&[data-highlighted],
		&:where(:enabled):hover {
			background-color: var(--c-background-light);
		}

		&:not(:has(> .icon)) {
			padding-inline-start: calc(2 * 0.25rem + 16px);
		}
	}

	.cb-option-list:has(> button) + .cb-empty {
		display: none;
	}

	.cb-empty {
		padding: 0.25rem;
		font-style: italic;
	}
`);(class e extends fe{static{window.customElements.get(`combo-box`)===void 0&&(window.customElements.define(`combo-box`,e),document.adoptedStyleSheets.push(pe))}get[Symbol.toStringTag](){return this.tagName}#e=``;#t=!1;#n=!1;#r=null;#i={"Alt+ArrowDown":{action:()=>this.#y()},"Alt+ArrowUp":{action:()=>this.#y()},ArrowDown:{action:()=>this.#y()},ArrowUp:{action:()=>this.#y()},ArrowLeft:{action:()=>this.#b(-1)},ArrowRight:{action:()=>this.#b(1)}};#a=``;#o=0;#s=null;#c={ArrowDown:{action:e=>this.#T(e,1)},ArrowUp:{action:e=>this.#T(e,-1)},Enter:{action:e=>this.#E(e)},Tab:{action:e=>this.#E(e)}};#l=null;#u=[];#d=[];constructor(){super(),this.id||=`${this.tagName.toLowerCase()}-${this.uniqueId}`,this.style.setProperty(`--anchor-name`,`--${this.id}`);let e=`#${this.getAttribute(`options-json`)}`,t=document.querySelector(e);this.#p=JSON.parse(t.textContent.trim()),this.setFormValue(this.value)}formDisabledCallback(e){this.disabledState=e}formResetCallback(){this.#t=!1,this.#_(this.defaultValue,{isUserTriggered:!1})}get defaultValue(){return this.getAttribute(`value`)??``}set defaultValue(e){this.setAttribute(`value`,e),this.#t||this.#_(e,{isUserTriggered:!1})}get disabled(){return this.hasAttribute(`disabled`)}set disabled(e){e?this.setAttribute(`disabled`,``):this.removeAttribute(`disabled`),this.queueRender()}get disabledState(){return this.disabled||this.#n}set disabledState(e){this.#n=e,this.queueRender()}get name(){return this.getAttribute(`name`)??``}set name(e){this.setAttribute(`name`,e)}get id(){return this.getAttribute(`id`)??``}set id(e){this.setAttribute(`id`,e),this.queueRender()}get required(){return this.hasAttribute(`required`)}set required(e){e?this.setAttribute(`required`,``):this.removeAttribute(`required`)}get query(){return this.#a}set query(e){this.#a=e,this.#d=this.#p.filter(t=>t.toLowerCase().includes(e)),this.queueRender()}get#p(){return this.#u}set#p(e){this.#u=e,this.#d=e.filter(e=>e.toLowerCase().includes(this.query)),this.queueRender()}get#m(){return this.#d}get#g(){return this.#o}set#g(e){this.#o=e,this.isConnected&&(this.#s=this.#v(e)),this.queueRender()}get value(){return this.#e||this.defaultValue}set value(e){this.#_(e,{isUserTriggered:!0})}#_(e,{isUserTriggered:t}){t&&(this.#t=!0),this.#e=e,this.setFormValue(this.value),this.#g=this.#m.indexOf(this.value),this.query=``,this.queueUpdate(()=>{this.renderIfIdle(),t&&(this.dispatchEvent(new Event(`input`,{bubbles:!0})),this.dispatchEvent(new Event(`change`,{bubbles:!0})))})}render(){this.isConnected&&(this.classList.add(`combo-box`),le(this.template(),this),this.#r=this.querySelector(`.cb-button`),this.#l=this.querySelector(`.cb-option-list`))}template(){return x`
			<button
				class="cb-button"
				type="button"
				aria-label="${this.getAttribute(`button-label`)??`Show options`}"
				aria-expanded="false"
				aria-controls="${this.id}-popover"
				popovertarget="${this.id}-popover"
				@keydown="${this.#x}"
			>
				${this.value}
				<svg class="icon">
					<use xlink:href="#caret-down-icon"></use>
				</svg>
			</button>

			<div
				id="${this.id}-popover"
				class="cb-popover"
				popover
				@toggle="${this.#S}"
			>
				<input
					class="cb-input text-input"
					aria-label="${this.getAttribute(`input-label`)??`Search`}"
					autocomplete="off"
					autofocus
					role="combobox"
					aria-autocomplete="list"
					aria-expanded="true"
					aria-controls="${this.id}-listbox"
					.ariaActiveDescendantElement="${this.#s}"
					.value="${this.query}"
					@input="${this.#C}"
					@keydown="${this.#w}"
				>

				<div
					id="${this.id}-listbox"
					class="cb-option-list"
					role="listbox"
					aria-label="${this.getAttribute(`listbox-label`)??`Options`}"
					@click="${this.#D}"
				>
					${this.#m.map((e,t)=>x`
								<button
									id="${this.id}-${t}"
									type="button"
									role="option"
									data-value="${e}"
									aria-selected="${String(e===this.value)}"
									?data-highlighted="${t===this.#g}"
								>
									${e===this.value?x`<svg class="icon">
												<use xlink:href="#check-icon"></use>
											</svg>`:``}
									${e}
								</button>
							`)}
				</div>

				<div class="cb-empty">
					<p>No matches</p>
				</div>
			</div>
		`}#v(e){let t=(this.#l?.children??[])[e];if(!(t instanceof HTMLElement))throw Error(`<${this.tagName.toLowerCase()} id="${this.id}">: no option at index ${e}!`);return t}#y=()=>{this.#r?.popoverTargetElement instanceof HTMLElement&&this.#r.popoverTargetElement.showPopover()};#b=e=>{let t=this.#p.findIndex(e=>e===this.value),n=Math.max(0,Math.min(t+e,this.#p.length-1));n!==t&&(this.value=this.#p[n])};#x=e=>{let t=me(e),n=this.#i[t];n&&n.action(e)};#S=e=>{let t=e.newState===`open`;if(this.#r.ariaExpanded=String(t),t){let e=this.#m.indexOf(this.value);this.#g=e;let t=this.#v(e);t&&he(t,this.#l)}};#C=e=>{this.#g=0;let t=e.target;this.query=t.value.trim().toLowerCase()};#w=e=>{let t=me(e),n=this.#c[t];n&&n.action(e)};#T=(e,t)=>{e.preventDefault();let n=this.#m.length;this.#g=Math.max(0,Math.min(this.#g+t,n-1));let r=this.#s;r instanceof HTMLElement&&he(r,this.#l)};#E=e=>{e.preventDefault();let t=this.#s;t instanceof HTMLElement&&this.#O(t.dataset.value)};#D=e=>{let t=e.composedPath().find(e=>e instanceof HTMLElement&&e.role===`option`);t instanceof HTMLElement&&this.#O(t.dataset.value)};#O=e=>{this.value=e,this.#r?.focus(),this.#r?.popoverTargetElement instanceof HTMLElement&&this.#r.popoverTargetElement.hidePopover()}});function me(e){return[e.metaKey?`Meta`:void 0,e.ctrlKey?`Ctrl`:void 0,e.altKey?`Alt`:void 0,e.shiftKey?`Shift`:void 0,e.key].filter(e=>e!==void 0).join(`+`)}function he(e,t){let n=e.getBoundingClientRect(),r=n.y+n.height,i=t.getBoundingClientRect(),a=i.y+i.height;n.y<i.y?t.scrollTop-=i.y-n.y:r>a&&(t.scrollTop+=r-a)}function ge(e,t,n,r,i){let a=+(i===`times`),o=Math.max(0,Math.min(2**t,n)),s=o;return r===`all`?s=n:r===`none`&&o<n&&(s=0),a+Math.min(s,n)*(e-a)/n}function _e(e,t){let n=e.filter(({enhancement:e})=>e===`Stone`),r=A(e,5),i=be(e,t);if(r.length>0&&i.length>0)return{playedHand:`Flush Five`,scoringCards:j(e,n,r,i)};let a=ve(e);if(a.length>0&&i.length>0)return{playedHand:`Flush House`,scoringCards:j(e,n,a,i)};if(r.length>0)return{playedHand:`Five of a Kind`,scoringCards:j(e,r,n)};let o=xe(e,t);if(i.length>0&&o.length>0)return{playedHand:`Straight Flush`,scoringCards:j(e,n,i,o)};let s=A(e,4);if(s.length>0)return{playedHand:`Four of a Kind`,scoringCards:j(e,s,n)};if(a.length>0)return{playedHand:`Full House`,scoringCards:j(e,a,n)};if(i.length>0)return{playedHand:`Flush`,scoringCards:j(e,i,n)};if(o.length>0)return{playedHand:`Straight`,scoringCards:j(e,o,n)};let c=A(e,3);if(c.length>0)return{playedHand:`Three of a Kind`,scoringCards:j(e,c,n)};let l=Se(e);if(l.length>0)return{playedHand:`Two Pair`,scoringCards:j(e,l,n)};let u=A(e,2);return u.length>0?{playedHand:`Pair`,scoringCards:j(e,u,n)}:{playedHand:`High Card`,scoringCards:j(e,Ce(e),n)}}function ve(e){let t=new Map;for(let n of e)n.enhancement!==`Stone`&&(t.has(n.rank)||t.set(n.rank,[]),t.get(n.rank).push(n));let n=[],r=[];for(let e of t.values())e.length===3?n.push(...e):e.length===2&&r.push(...e);return n.length>0&&r.length>0?e.filter(e=>n.includes(e)||r.includes(e)):[]}var ye={Spades:`Clubs`,Hearts:`Diamonds`,Clubs:`Spades`,Diamonds:`Hearts`};function be(e,t){let n=t.has(`Four Fingers`)?4:5,r=new Map;for(let n of e){if(n.enhancement===`Stone`)continue;let e=n.enhancement===`Wild`?[`Spades`,`Hearts`,`Clubs`,`Diamonds`]:t.has(`Smeared Joker`)?[n.suit,ye[n.suit]]:[n.suit];for(let t of e)r.has(t)||r.set(t,[]),r.get(t).push(n)}for(let e of r.values())if(e.length>=n)return e;return[]}function xe(e,t){let n=t.has(`Four Fingers`)?4:5,r=t.has(`Shortcut`)?2:1,i=e.filter(({enhancement:e})=>e!==`Stone`).flatMap(({rank:e})=>e===`Ace`?[Ve[e],1]:[Ve[e]]).toSorted((e,t)=>e-t),a=Array.from({length:r},(e,t)=>t+1),o=i.at(0),s=[o],c=!1;for(let e=1;e<i.length;e++){let t=i[e];if(a.some(e=>o+e===t))s.push(t),s.length===n&&(c=!0);else if(s.includes(t))continue;else c||(s.length=0,s.push(t));o=t}return c?e.filter(({rank:e})=>e===`Ace`&&s.includes(1)?!0:s.includes(Ve[e])):[]}function Se(e){let t=new Map;for(let n of e)n.enhancement!==`Stone`&&(t.has(n.rank)||t.set(n.rank,[]),t.get(n.rank).push(n));let n=[],r=[];for(let e of t.values())if(e.length===2)if(n.length>0){r.push(...e);break}else n.push(...e);return n.length>0&&r.length>0?n.concat(...r):[]}function A(e,t){let n=new Map;for(let t of e)t.enhancement!==`Stone`&&(n.has(t.rank)||n.set(t.rank,[]),n.get(t.rank).push(t));let r=[];for(let e of n.values())e.length>=t&&r.push(...e);return r}function Ce(e){let t,n=0;for(let r of e){r.enhancement===`Stone`&&t===void 0&&(t=r);let e=Be[r.rank];e>n&&(n=e,t=r)}return[t]}function j(e,...t){return e.filter(e=>{for(let n of t)if(n.some(({index:t})=>t===e.index))return!0;return!1})}function we(e,t,n){return!!(t.active&&(t.name===`Verdant Leaf`||t.name===`The Club`&&M(e,`Clubs`,n)||t.name===`The Goad`&&M(e,`Spades`,n)||t.name===`The Head`&&M(e,`Hearts`,n)||t.name===`The Window`&&M(e,`Diamonds`,n)||t.name===`The Plant`&&Te(e,n)))}function Te(e,t){return t.has(`Pareidolia`)?!0:Ee(e,[`King`,`Queen`,`Jack`])}function Ee(e,t){return e.debuffed||e.enhancement===`Stone`?!1:(Array.isArray(t)?t:[t]).includes(e.rank)}function M(e,t,n){if(e.debuffed&&e.enhancement!==`Wild`||e.enhancement===`Stone`)return!1;if(e.enhancement===`Wild`&&!e.debuffed)return!0;let r=new Set(Array.isArray(t)?t:[t]);return n.has(`Smeared Joker`)&&(r.has(`Clubs`)&&r.add(`Spades`),r.has(`Spades`)&&r.add(`Clubs`),r.has(`Hearts`)&&r.add(`Diamonds`),r.has(`Diamonds`)&&r.add(`Hearts`)),r.has(e.suit)}function De(e,t,n=new Set){if(t.name!==`Blueprint`&&t.name!==`Brainstorm`)return t;let r=e.at(t.name===`Blueprint`?t.index+1:0);if(r!==void 0&&!n.has(r.index))return n.add(r.index),De(e,r,n)}var Oe=`Small Blind.Big Blind.The Hook.The Ox.The House.The Wall.The Wheel.The Arm.The Club.The Fish.The Psychic.The Goad.The Water.The Window.The Manacle.The Eye.The Mouth.The Plant.The Serpent.The Pillar.The Needle.The Head.The Tooth.The Flint.The Mark.Amber Acorn.Verdant Leaf.Violet Vessel.Crimson Heart.Cerulean Bell`.split(`.`),ke=[`Red Deck`,`Blue Deck`,`Yellow Deck`,`Green Deck`,`Black Deck`,`Magic Deck`,`Nebula Deck`,`Ghost Deck`,`Abandoned Deck`,`Checkered Deck`,`Zodiac Deck`,`Painted Deck`,`Anaglyph Deck`,`Plasma Deck`,`Erratic Deck`,`Challenge Deck`],Ae=[`Flush Five`,`Flush House`,`Five of a Kind`,`Straight Flush`,`Four of a Kind`,`Full House`,`Flush`,`Straight`,`Three of a Kind`,`Two Pair`,`Pair`,`High Card`],je=[`None`,`Bonus`,`Mult`,`Wild`,`Glass`,`Steel`,`Stone`,`Gold`,`Lucky`],Me=[`None`,`Gold`,`Red`,`Blue`,`Purple`],Ne=[`Base`,`Foil`,`Holographic`,`Polychrome`],Pe=[`Base`,`Foil`,`Holographic`,`Polychrome`,`Negative`],Fe=[`Ace`,`King`,`Queen`,`Jack`,`10`,`9`,`8`,`7`,`6`,`5`,`4`,`3`,`2`],Ie=[`Clubs`,`Spades`,`Hearts`,`Diamonds`],Le=[`none`,`average`,`all`],Re={"Flush Five":{chips:50,multiplier:3},"Flush House":{chips:40,multiplier:4},"Five of a Kind":{chips:35,multiplier:3},"Straight Flush":{chips:40,multiplier:4},"Four of a Kind":{chips:30,multiplier:3},"Full House":{chips:25,multiplier:2},Flush:{chips:15,multiplier:2},Straight:{chips:30,multiplier:3},"Three of a Kind":{chips:20,multiplier:2},"Two Pair":{chips:20,multiplier:1},Pair:{chips:15,multiplier:1},"High Card":{chips:10,multiplier:1}},ze={"Flush Five":{chips:160,multiplier:16},"Flush House":{chips:140,multiplier:14},"Five of a Kind":{chips:120,multiplier:12},"Straight Flush":{chips:100,multiplier:8},"Four of a Kind":{chips:60,multiplier:7},"Full House":{chips:40,multiplier:4},Flush:{chips:35,multiplier:4},Straight:{chips:30,multiplier:4},"Three of a Kind":{chips:30,multiplier:3},"Two Pair":{chips:20,multiplier:2},Pair:{chips:10,multiplier:2},"High Card":{chips:5,multiplier:1}},Be={Ace:11,King:10,Queen:10,Jack:10,10:10,9:9,8:8,7:7,6:6,5:5,4:4,3:3,2:2},Ve={Ace:14,King:13,Queen:12,Jack:11,10:10,9:9,8:8,7:7,6:6,5:5,4:4,3:3,2:2},He={Joker:{rarity:`common`,effect({score:e,trigger:t}){e.push({multiplier:[`+`,4],phase:`jokers`,joker:this,trigger:t})}},"Greedy Joker":{rarity:`common`,playedCardEffect({state:e,score:t,card:n,trigger:r}){t.push({multiplier:[`+`,M(n,`Diamonds`,e.jokerSet)?3:0],phase:`played-cards`,card:n,joker:this,trigger:r})}},"Lusty Joker":{rarity:`common`,playedCardEffect({state:e,score:t,card:n,trigger:r}){t.push({multiplier:[`+`,M(n,`Hearts`,e.jokerSet)?3:0],phase:`played-cards`,card:n,joker:this,trigger:r})}},"Wrathful Joker":{rarity:`common`,playedCardEffect({state:e,score:t,card:n,trigger:r}){t.push({multiplier:[`+`,M(n,`Spades`,e.jokerSet)?3:0],phase:`played-cards`,card:n,joker:this,trigger:r})}},"Gluttonous Joker":{rarity:`common`,playedCardEffect({state:e,score:t,card:n,trigger:r}){t.push({multiplier:[`+`,M(n,`Clubs`,e.jokerSet)?3:0],phase:`played-cards`,card:n,joker:this,trigger:r})}},"Jolly Joker":{rarity:`common`,effect({state:e,score:t,trigger:n}){let r=A(e.cards.filter(({played:e})=>e),2);t.push({multiplier:[`+`,r.length>0?8:0],phase:`jokers`,joker:this,trigger:n})}},"Zany Joker":{rarity:`common`,effect({state:e,score:t,trigger:n}){let r=A(e.cards.filter(({played:e})=>e),3);t.push({multiplier:[`+`,r.length>0?8:0],phase:`jokers`,joker:this,trigger:n})}},"Mad Joker":{rarity:`common`,effect({state:e,score:t,trigger:n}){let r=Se(e.cards.filter(({played:e})=>e));t.push({multiplier:[`+`,r.length>0?8:0],phase:`jokers`,joker:this,trigger:n})}},"Crazy Joker":{rarity:`common`,effect({state:e,score:t,trigger:n}){let r=xe(e.cards.filter(({played:e})=>e),e.jokerSet);t.push({multiplier:[`+`,r.length>0?12:0],phase:`jokers`,joker:this,trigger:n})}},"Droll Joker":{rarity:`common`,effect({state:e,score:t,trigger:n}){let r=be(e.cards.filter(({played:e})=>e),e.jokerSet);t.push({multiplier:[`+`,r.length>0?10:0],phase:`jokers`,joker:this,trigger:n})}},"Sly Joker":{rarity:`common`,effect({state:e,score:t,trigger:n}){let r=A(e.cards.filter(({played:e})=>e),2);t.push({chips:[`+`,r.length>0?50:0],phase:`jokers`,joker:this,trigger:n})}},"Wily Joker":{rarity:`common`,effect({state:e,score:t,trigger:n}){let r=A(e.cards.filter(({played:e})=>e),3);t.push({chips:[`+`,r.length>0?100:0],phase:`jokers`,joker:this,trigger:n})}},"Clever Joker":{rarity:`common`,effect({state:e,score:t,trigger:n}){let r=Se(e.cards.filter(({played:e})=>e));t.push({chips:[`+`,r.length>0?150:0],phase:`jokers`,joker:this,trigger:n})}},"Devious Joker":{rarity:`common`,effect({state:e,score:t,trigger:n}){let r=xe(e.cards.filter(({played:e})=>e),e.jokerSet);t.push({chips:[`+`,r.length>0?100:0],phase:`jokers`,joker:this,trigger:n})}},"Crafty Joker":{rarity:`common`,effect({state:e,score:t,trigger:n}){let r=be(e.cards.filter(({played:e})=>e),e.jokerSet);t.push({chips:[`+`,r.length>0?80:0],phase:`jokers`,joker:this,trigger:n})}},"Half Joker":{rarity:`common`,effect({state:e,score:t,trigger:n}){t.push({multiplier:[`+`,e.cards.filter(({played:e})=>e).length<=3?20:0],phase:`jokers`,joker:this,trigger:n})}},"Joker Stencil":{rarity:`uncommon`,effect({state:e,score:t,trigger:n}){let r=e.jokers.filter(e=>e.name!==`Joker Stencil`&&e.edition!==`Negative`);t.push({multiplier:[`*`,Math.max(1,e.jokerSlots-r.length)],phase:`jokers`,joker:this,trigger:n})}},"Four Fingers":{rarity:`uncommon`},Mime:{rarity:`uncommon`},"Credit Card":{rarity:`common`},"Ceremonial Dagger":{rarity:`uncommon`,hasPlusMultiplierInput:!0,effect({score:e,trigger:t}){e.push({multiplier:[`+`,this.plusMultiplier],phase:`jokers`,joker:this,trigger:t})}},Banner:{rarity:`common`,effect({state:e,score:t,trigger:n}){t.push({chips:[`+`,e.discards*30],phase:`jokers`,joker:this,trigger:n})}},"Mystic Summit":{rarity:`common`,effect({state:e,score:t,trigger:n}){t.push({multiplier:[`+`,e.discards===0?15:0],phase:`jokers`,joker:this,trigger:n})}},"Marble Joker":{rarity:`uncommon`},"Loyalty Card":{rarity:`uncommon`,hasIsActiveInput:!0,effect({score:e,trigger:t}){e.push({multiplier:[`*`,this.active?4:1],phase:`jokers`,joker:this,trigger:t})}},"8 Ball":{rarity:`common`},Misprint:{rarity:`common`,effect({score:e,luck:t,trigger:n}){e.push({multiplier:[`+`,t===`all`?23:t===`none`?0:11.5],phase:`jokers`,joker:this,trigger:n})}},Dusk:{rarity:`uncommon`},"Raised Fist":{rarity:`common`,heldCardEffect({state:e,card:t,score:n,trigger:r}){if(t.enhancement===`Stone`)return;let i=e.cards.filter(({played:e})=>!e);if(i.length===0)return;let a=Be[i.toSorted((e,t)=>Be[e.rank]-Be[t.rank]).at(0).rank],o=i.filter(({rank:e})=>Be[e]===a).at(-1);o.index===t.index&&n.push({multiplier:[`+`,2*Be[o.rank]],phase:`held-cards`,joker:this,trigger:r})}},"Chaos the Clown":{rarity:`common`},Fibonacci:{rarity:`uncommon`,playedCardEffect({score:e,card:t,trigger:n}){e.push({multiplier:[`+`,Ee(t,[`Ace`,`2`,`3`,`5`,`8`])?8:0],phase:`played-cards`,card:t,joker:this,trigger:n})}},"Steel Joker":{rarity:`uncommon`,hasTimesMultiplierInput:!0,effect({score:e,trigger:t}){e.push({multiplier:[`*`,this.timesMultiplier],phase:`jokers`,joker:this,trigger:t})}},"Scary Face":{rarity:`common`,playedCardEffect({state:e,score:t,card:n,trigger:r}){t.push({chips:[`+`,Te(n,e.jokerSet)?30:0],phase:`played-cards`,card:n,joker:this,trigger:r})}},"Abstract Joker":{rarity:`common`,effect({state:e,score:t,trigger:n}){t.push({multiplier:[`+`,3*e.jokers.length],phase:`jokers`,joker:this,trigger:n})}},"Delayed Gratification":{rarity:`common`},Hack:{rarity:`uncommon`},Pareidolia:{rarity:`uncommon`},"Gros Michel":{rarity:`common`,effect({score:e,trigger:t}){e.push({multiplier:[`+`,15],phase:`jokers`,joker:this,trigger:t})}},"Even Steven":{rarity:`common`,playedCardEffect({score:e,card:t,trigger:n}){e.push({multiplier:[`+`,Ee(t,[`10`,`8`,`6`,`4`,`2`])?4:0],phase:`played-cards`,card:t,joker:this,trigger:n})}},"Odd Todd":{rarity:`common`,playedCardEffect({score:e,card:t,trigger:n}){e.push({chips:[`+`,Ee(t,[`Ace`,`9`,`7`,`5`,`3`])?31:0],phase:`played-cards`,card:t,joker:this,trigger:n})}},Scholar:{rarity:`common`,playedCardEffect({score:e,card:t,trigger:n}){let r=Ee(t,`Ace`);e.push({chips:[`+`,r?20:0],multiplier:[`+`,r?4:0],phase:`played-cards`,card:t,joker:this,trigger:n})}},"Business Card":{rarity:`common`},Supernova:{rarity:`common`,effect({state:e,score:t,playedHand:n,trigger:r}){t.push({multiplier:[`+`,e.handLevels[n].plays+1],phase:`jokers`,joker:this,trigger:r})}},"Ride the Bus":{rarity:`common`,hasPlusMultiplierInput:!0,effect({score:e,trigger:t}){e.push({multiplier:[`+`,this.plusMultiplier],phase:`jokers`,joker:this,trigger:t})}},"Space Joker":{rarity:`uncommon`},Egg:{rarity:`common`},Burglar:{rarity:`uncommon`},Blackboard:{rarity:`uncommon`,effect({state:e,score:t,trigger:n}){let r=e.cards.filter(({played:e})=>!e).every(t=>M(t,[`Spades`,`Clubs`],e.jokerSet));t.push({multiplier:[`*`,r?3:1],phase:`jokers`,joker:this,trigger:n})}},Runner:{rarity:`common`,hasPlusChipsInput:!0,effect({score:e,trigger:t}){e.push({chips:[`+`,this.plusChips],phase:`jokers`,joker:this,trigger:t})}},"Ice Cream":{rarity:`common`,hasPlusChipsInput:!0,effect({score:e,trigger:t}){e.push({chips:[`+`,this.plusChips],phase:`jokers`,joker:this,trigger:t})}},DNA:{rarity:`rare`},Splash:{rarity:`common`},"Blue Joker":{rarity:`common`,hasPlusChipsInput:!0,effect({score:e,trigger:t}){e.push({chips:[`+`,this.plusChips],phase:`jokers`,joker:this,trigger:t})}},"Sixth Sense":{rarity:`uncommon`},Constellation:{rarity:`uncommon`,hasTimesMultiplierInput:!0,effect({score:e,trigger:t}){e.push({multiplier:[`*`,this.timesMultiplier],phase:`jokers`,joker:this,trigger:t})}},Hiker:{rarity:`common`,hasPlusChipsInput:!0,effect({score:e,trigger:t}){e.push({chips:[`+`,this.plusChips],phase:`jokers`,joker:this,trigger:t})}},"Faceless Joker":{rarity:`common`},"Green Joker":{rarity:`common`,hasPlusMultiplierInput:!0,effect({score:e,trigger:t}){e.push({multiplier:[`+`,this.plusMultiplier],phase:`jokers`,joker:this,trigger:t})}},Superposition:{rarity:`common`},"To Do List":{rarity:`common`},Cavendish:{rarity:`common`,effect({score:e,trigger:t}){e.push({multiplier:[`*`,3],phase:`jokers`,joker:this,trigger:t})}},"Card Sharp":{rarity:`uncommon`,hasIsActiveInput:!0,effect({score:e,trigger:t}){e.push({multiplier:[`*`,this.active?3:1],phase:`jokers`,joker:this,trigger:t})}},"Red Card":{rarity:`common`,hasPlusMultiplierInput:!0,effect({score:e,trigger:t}){e.push({multiplier:[`+`,this.plusMultiplier],phase:`jokers`,joker:this,trigger:t})}},Madness:{rarity:`uncommon`,hasTimesMultiplierInput:!0,effect({score:e,trigger:t}){e.push({multiplier:[`*`,this.timesMultiplier],phase:`jokers`,joker:this,trigger:t})}},"Square Joker":{rarity:`common`,hasPlusChipsInput:!0,effect({score:e,trigger:t}){e.push({chips:[`+`,this.plusChips],phase:`jokers`,joker:this,trigger:t})}},Séance:{rarity:`uncommon`},"Riff-Raff":{rarity:`common`},Vampire:{rarity:`rare`,hasTimesMultiplierInput:!0,effect({score:e,trigger:t}){e.push({multiplier:[`*`,this.timesMultiplier],phase:`jokers`,joker:this,trigger:t})}},Shortcut:{rarity:`common`},Hologram:{rarity:`uncommon`,hasTimesMultiplierInput:!0,effect({score:e,trigger:t}){e.push({multiplier:[`*`,this.timesMultiplier],phase:`jokers`,joker:this,trigger:t})}},Vagabond:{rarity:`rare`},Baron:{rarity:`rare`,heldCardEffect({score:e,card:t,trigger:n}){e.push({multiplier:[`*`,t.rank===`King`?1.5:1],phase:`held-cards`,card:t,joker:this,trigger:n})}},"Cloud 9":{rarity:`uncommon`},Rocket:{rarity:`uncommon`},Obelisk:{rarity:`rare`,hasTimesMultiplierInput:!0,effect({score:e,trigger:t}){e.push({multiplier:[`*`,this.timesMultiplier],phase:`jokers`,joker:this,trigger:t})}},"Midas Mask":{rarity:`uncommon`},Luchador:{rarity:`uncommon`},Photograph:{rarity:`common`,playedCardEffect({state:e,score:t,card:n,trigger:r}){let i=e.cards.filter(({played:e})=>e).find(e=>[`King`,`Queen`,`Jack`].includes(e.rank)),a=n.index===i?.index;t.push({multiplier:[`*`,a?2:1],phase:`played-cards`,card:n,joker:this,trigger:r})}},"Gift Card":{rarity:`uncommon`},"Turtle Bean":{rarity:`uncommon`},Erosion:{rarity:`uncommon`,hasPlusMultiplierInput:!0,effect({score:e,trigger:t}){e.push({multiplier:[`+`,this.plusMultiplier],phase:`jokers`,joker:this,trigger:t})}},"Reserved Parking":{rarity:`common`},"Mail-in Rebate":{rarity:`common`},"To the Moon":{rarity:`uncommon`},Hallucination:{rarity:`common`},"Fortune Teller":{rarity:`common`,hasPlusMultiplierInput:!0,effect({score:e,trigger:t}){e.push({multiplier:[`+`,this.plusMultiplier],phase:`jokers`,joker:this,trigger:t})}},Juggler:{rarity:`common`},Drunkard:{rarity:`common`},"Stone Joker":{rarity:`uncommon`,hasPlusChipsInput:!0,effect({score:e,trigger:t}){e.push({chips:[`+`,this.plusChips],phase:`jokers`,joker:this,trigger:t})}},"Golden Joker":{rarity:`common`},"Lucky Cat":{rarity:`uncommon`,hasTimesMultiplierInput:!0,effect({score:e,trigger:t}){e.push({multiplier:[`*`,this.timesMultiplier],phase:`jokers`,joker:this,trigger:t})}},"Baseball Card":{rarity:`rare`,indirectEffect({score:e,joker:t,trigger:n}){e.push({multiplier:[`*`,t.rarity===`uncommon`?1.5:1],phase:`jokers`,joker:this,trigger:n})}},Bull:{rarity:`uncommon`,effect({state:e,score:t,trigger:n}){t.push({chips:[`+`,e.money*2],phase:`jokers`,joker:this,trigger:n})}},"Diet Cola":{rarity:`uncommon`},"Trading Card":{rarity:`uncommon`},"Flash Card":{rarity:`uncommon`,hasPlusMultiplierInput:!0,effect({score:e,trigger:t}){e.push({multiplier:[`+`,this.plusMultiplier],phase:`jokers`,joker:this,trigger:t})}},Popcorn:{rarity:`common`,hasPlusMultiplierInput:!0,effect({score:e,trigger:t}){e.push({multiplier:[`+`,this.plusMultiplier],phase:`jokers`,joker:this,trigger:t})}},"Spare Trousers":{rarity:`uncommon`,hasPlusMultiplierInput:!0,effect({score:e,trigger:t}){e.push({multiplier:[`+`,this.plusMultiplier],phase:`jokers`,joker:this,trigger:t})}},"Ancient Joker":{rarity:`rare`,hasSuitInput:!0,playedCardEffect({state:e,score:t,card:n,trigger:r}){t.push({multiplier:[`*`,M(n,this.suit,e.jokerSet)?1.5:1],phase:`played-cards`,card:n,joker:this,trigger:r})}},Ramen:{rarity:`uncommon`,hasTimesMultiplierInput:!0,effect({score:e,trigger:t}){e.push({multiplier:[`*`,this.timesMultiplier],phase:`jokers`,joker:this,trigger:t})}},"Walkie Talkie":{rarity:`common`,playedCardEffect({score:e,card:t,trigger:n}){let r=Ee(t,[`4`,`10`]);e.push({chips:[`+`,r?10:0],multiplier:[`+`,r?4:0],phase:`played-cards`,card:t,joker:this,trigger:n})}},Seltzer:{rarity:`uncommon`},Castle:{rarity:`uncommon`,hasPlusChipsInput:!0,effect({score:e,trigger:t}){e.push({chips:[`+`,this.plusChips],phase:`jokers`,joker:this,trigger:t})}},"Smiley Face":{rarity:`common`,playedCardEffect({state:e,score:t,card:n,trigger:r}){t.push({multiplier:[`+`,Te(n,e.jokerSet)?5:0],phase:`played-cards`,card:n,joker:this,trigger:r})}},Campfire:{rarity:`rare`,hasTimesMultiplierInput:!0,effect({score:e,trigger:t}){e.push({multiplier:[`*`,this.timesMultiplier],phase:`jokers`,joker:this,trigger:t})}},"Golden Ticket":{rarity:`common`},"Mr. Bones":{rarity:`uncommon`},Acrobat:{rarity:`uncommon`,effect({state:e,score:t,trigger:n}){t.push({multiplier:[`*`,e.hands===1?3:1],phase:`jokers`,joker:this,trigger:n})}},"Sock and Buskin":{rarity:`uncommon`},Swashbuckler:{rarity:`common`,hasPlusMultiplierInput:!0,effect({score:e,trigger:t}){e.push({multiplier:[`+`,this.plusMultiplier],phase:`jokers`,joker:this,trigger:t})}},Troubador:{rarity:`uncommon`},Certificate:{rarity:`uncommon`},"Smeared Joker":{rarity:`uncommon`},Throwback:{rarity:`uncommon`,hasTimesMultiplierInput:!0,effect({score:e,trigger:t}){e.push({multiplier:[`*`,this.timesMultiplier],phase:`jokers`,joker:this,trigger:t})}},"Hanging Chad":{rarity:`common`},"Rough Gem":{rarity:`uncommon`},Bloodstone:{rarity:`uncommon`,playedCardEffect({state:e,score:t,card:n,luck:r,trigger:i}){if(M(n,`Hearts`,e.jokerSet)){let a=ge(2,e.jokers.filter(({name:e})=>e===`Oops! All 6s`).length,2,r,`times`);t.push({multiplier:[`*`,a],phase:`played-cards`,card:n,joker:this,trigger:i})}}},Arrowhead:{rarity:`uncommon`,playedCardEffect({state:e,score:t,card:n,trigger:r}){t.push({chips:[`+`,M(n,`Spades`,e.jokerSet)?50:0],phase:`played-cards`,card:n,joker:this,trigger:r})}},"Onyx Agate":{rarity:`uncommon`,playedCardEffect({state:e,score:t,card:n,trigger:r}){t.push({multiplier:[`+`,M(n,`Clubs`,e.jokerSet)?7:0],phase:`played-cards`,card:n,joker:this,trigger:r})}},"Glass Joker":{rarity:`uncommon`,hasTimesMultiplierInput:!0,effect({score:e,trigger:t}){e.push({multiplier:[`*`,this.timesMultiplier],phase:`jokers`,joker:this,trigger:t})}},Showman:{rarity:`uncommon`},"Flower Pot":{rarity:`uncommon`,effect({state:e,score:t,scoringCards:n,trigger:r}){if(n.length<4)return;let i=!1,a=[`Spades`,`Hearts`,`Clubs`,`Diamonds`],o=new Set;for(let t of a)for(let r of n)o.has(r)||(r.debuffed?r.suit===t:M(r,t,e.jokerSet))&&(o.add(r),o.size===4&&(i=!0));t.push({multiplier:[`*`,i?3:1],phase:`jokers`,joker:this,trigger:r})}},Blueprint:{rarity:`rare`,effect(e){let t=De(e.state.jokers,this);t&&t.effect&&t.effect(e)},indirectEffect(e){let t=De(e.state.jokers,this);t&&t.indirectEffect&&t.indirectEffect(e)}},"Wee Joker":{rarity:`rare`,hasPlusChipsInput:!0,effect({score:e,trigger:t}){e.push({chips:[`+`,this.plusChips],phase:`jokers`,joker:this,trigger:t})}},"Merry Andy":{rarity:`uncommon`},"Oops! All 6s":{rarity:`uncommon`},"The Idol":{rarity:`uncommon`,hasRankInput:!0,hasSuitInput:!0,playedCardEffect({state:e,score:t,card:n,trigger:r}){t.push({multiplier:[`*`,this.suit&&M(n,this.suit,e.jokerSet)&&n.rank===this.rank?2:1],phase:`played-cards`,card:n,joker:this,trigger:r})}},"Seeing Double":{rarity:`uncommon`,effect({state:e,score:t,scoringCards:n,trigger:r}){let i=n.some(t=>M(t,`Clubs`,e.jokerSet)),a=n.some(t=>M(t,[`Spades`,`Hearts`,`Diamonds`],e.jokerSet));t.push({multiplier:[`*`,i&&a?2:1],phase:`jokers`,joker:this,trigger:r})}},Matador:{rarity:`uncommon`},"Hit the Road":{rarity:`rare`,hasTimesMultiplierInput:!0,effect({score:e,trigger:t}){e.push({multiplier:[`*`,this.timesMultiplier],phase:`jokers`,joker:this,trigger:t})}},"The Duo":{rarity:`rare`,effect({state:e,score:t,trigger:n}){let r=A(e.cards.filter(({played:e})=>e),2);t.push({multiplier:[`*`,r.length>0?2:1],phase:`jokers`,joker:this,trigger:n})}},"The Trio":{rarity:`rare`,effect({state:e,score:t,trigger:n}){let r=A(e.cards.filter(({played:e})=>e),3);t.push({multiplier:[`*`,r.length>0?3:1],phase:`jokers`,joker:this,trigger:n})}},"The Family":{rarity:`rare`,effect({state:e,score:t,trigger:n}){let r=A(e.cards.filter(({played:e})=>e),4);t.push({multiplier:[`*`,r.length>0?4:1],phase:`jokers`,joker:this,trigger:n})}},"The Order":{rarity:`common`,effect({state:e,score:t,trigger:n}){let r=xe(e.cards.filter(({played:e})=>e),e.jokerSet);t.push({multiplier:[`*`,r.length>0?3:1],phase:`jokers`,joker:this,trigger:n})}},"The Tribe":{rarity:`rare`,effect({state:e,score:t,trigger:n}){let r=be(e.cards.filter(({played:e})=>e),e.jokerSet);t.push({multiplier:[`*`,r.length>0?2:1],phase:`jokers`,joker:this,trigger:n})}},Stuntman:{rarity:`rare`,effect({score:e,trigger:t}){e.push({chips:[`+`,250],phase:`jokers`,joker:this,trigger:t})}},"Invisible Joker":{rarity:`rare`},Brainstorm:{rarity:`rare`,effect(e){let t=De(e.state.jokers,this);t&&t.effect&&t.effect(e)},indirectEffect(e){let t=De(e.state.jokers,this);t&&t.indirectEffect&&t.indirectEffect(e)}},Satellite:{rarity:`uncommon`},"Shoot the Moon":{rarity:`common`,heldCardEffect({score:e,card:t,trigger:n}){e.push({multiplier:[`+`,t.rank===`Queen`?13:0],phase:`held-cards`,card:t,joker:this,trigger:n})}},"Driver's license":{rarity:`rare`,hasIsActiveInput:!0,effect({score:e,trigger:t}){e.push({multiplier:[`*`,this.active?3:1],phase:`jokers`,joker:this,trigger:t})}},Cartomancer:{rarity:`uncommon`},Astronomer:{rarity:`uncommon`},"Burnt Joker":{rarity:`rare`},Bootstraps:{rarity:`common`,effect({state:e,score:t,trigger:n}){let r=Math.max(0,Math.floor(e.money/5));t.push({multiplier:[`+`,r*2],phase:`jokers`,joker:this,trigger:n})}},Canio:{rarity:`legendary`,hasTimesMultiplierInput:!0,effect({score:e,trigger:t}){e.push({multiplier:[`*`,this.timesMultiplier],phase:`jokers`,joker:this,trigger:t})}},Triboulet:{rarity:`legendary`,playedCardEffect({score:e,card:t,trigger:n}){e.push({multiplier:[`*`,Ee(t,[`King`,`Queen`])?2:0],phase:`played-cards`,card:t,joker:this,trigger:n})}},Yorick:{rarity:`legendary`,hasTimesMultiplierInput:!0,effect({score:e,trigger:t}){e.push({multiplier:[`*`,this.timesMultiplier],phase:`jokers`,joker:this,trigger:t})}},Chicot:{rarity:`legendary`},Perkeo:{rarity:`legendary`}},Ue=Object.keys(He);function We(e){let{hands:t=0,discards:n=0,money:r=0,blind:i,deck:a=`Red Deck`,observatory:o={},handLevels:s={},jokers:c=[],jokerSlots:l=5,cards:u=[]}=e,d=Ge(o),f=Ke(s),p=qe(f),m=c.map(Je),h=new Set(m.map(({name:e})=>e)),g=h.has(`Chicot`)?!1:i?.active??!0,_={name:i?.name??`Small Blind`,active:g};return{hands:t,discards:n,money:r,blind:_,deck:a,observatory:d,handLevels:f,handBaseScores:p,jokers:m,jokerSet:h,jokerSlots:l,cards:u.map(Ye).map(e=>({...e,debuffed:e.debuffed?!0:we(e,_,h)}))}}function Ge(e){let t=Ae.map(t=>[t,e[t]??0]);return Object.fromEntries(t)}function Ke(e){let t=Object.keys(ze).map(t=>[t,e[t]??{level:1,plays:0}]);return Object.fromEntries(t)}function qe(e){let t=Object.entries(e).map(([e,{level:t}])=>{let n=ze[e],r=Re[e];return[e,{chips:t===0?0:n.chips+(t-1)*r.chips,multiplier:t===0?0:n.multiplier+(t-1)*r.multiplier}]});return Object.fromEntries(t)}function Je(e,t=0){let{index:n=t,name:r,edition:i=`Base`,plusChips:a=0,plusMultiplier:o=0,timesMultiplier:s=1,rank:c,suit:l,active:u=!1,count:d=1}=e,{rarity:f,effect:p,indirectEffect:m,playedCardEffect:h,heldCardEffect:g}=He[r],_=[i===`Base`?void 0:i].filter(e=>e!==void 0);return{index:n,name:r,edition:i,plusChips:a,plusMultiplier:o,timesMultiplier:s,rank:c,suit:l,active:u,count:d,rarity:f,effect:p,indirectEffect:m,playedCardEffect:h,heldCardEffect:g,toString:()=>`${r}`+(_.length>0?` (${_.join(`, `)})`:``)}}function Ye(e,t=0){let{index:n=t,rank:r,suit:i,edition:a=`Base`,enhancement:o=`None`,seal:s=`None`,debuffed:c=!1,played:l=!1,count:u=1}=e,d=[a===`Base`?void 0:a,o===`None`?void 0:o,s===`None`?void 0:s].filter(e=>e!==void 0);return{index:n,rank:r,suit:i,edition:a,enhancement:o,seal:s,debuffed:c,played:l,count:u,toString:()=>`${r} of ${i}`+(d.length>0?` (${d.join(`, `)})`:``)}}var Xe=9e15,N=1e9,Ze=`0123456789abcdef`,Qe=`2.3025850929940456840179914546843642076011014886287729760333279009675726096773524802359972050895982983419677840422862486334095254650828067566662873690987816894829072083255546808437998948262331985283935053089653777326288461633662222876982198867465436674744042432743651550489343149393914796194044002221051017141748003688084012647080685567743216228355220114804663715659121373450747856947683463616792101806445070648000277502684916746550586856935673420670581136429224554405758925724208241314695689016758940256776311356919292033376587141660230105703089634572075440370847469940168269282808481184289314848524948644871927809676271275775397027668605952496716674183485704422507197965004714951050492214776567636938662976979522110718264549734772662425709429322582798502585509785265383207606726317164309505995087807523710333101197857547331541421808427543863591778117054309827482385045648019095610299291824318237525357709750539565187697510374970888692180205189339507238539205144634197265287286965110862571492198849978748873771345686209167058`,$e=`3.1415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679821480865132823066470938446095505822317253594081284811174502841027019385211055596446229489549303819644288109756659334461284756482337867831652712019091456485669234603486104543266482133936072602491412737245870066063155881748815209209628292540917153643678925903600113305305488204665213841469519415116094330572703657595919530921861173819326117931051185480744623799627495673518857527248912279381830119491298336733624406566430860213949463952247371907021798609437027705392171762931767523846748184676694051320005681271452635608277857713427577896091736371787214684409012249534301465495853710507922796892589235420199561121290219608640344181598136297747713099605187072113499999983729780499510597317328160963185950244594553469083026425223082533446850352619311881710100031378387528865875332083814206171776691473035982534904287554687311595628638823537875937519577818577805321712268066130019278766111959092164201989380952572010654858632789`,et={precision:20,rounding:4,modulo:1,toExpNeg:-7,toExpPos:21,minE:-Xe,maxE:Xe,crypto:!1},tt,P,F=!0,nt=`[DecimalError] `,rt=nt+`Invalid argument: `,it=nt+`Precision limit exceeded`,at=nt+`crypto unavailable`,ot=`[object Decimal]`,I=Math.floor,L=Math.pow,st=/^0b([01]+(\.[01]*)?|\.[01]+)(p[+-]?\d+)?$/i,ct=/^0x([0-9a-f]+(\.[0-9a-f]*)?|\.[0-9a-f]+)(p[+-]?\d+)?$/i,lt=/^0o([0-7]+(\.[0-7]*)?|\.[0-7]+)(p[+-]?\d+)?$/i,ut=/^(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?$/i,R=1e7,z=7,dt=9007199254740991,ft=Qe.length-1,pt=$e.length-1,B={toStringTag:ot};B.absoluteValue=B.abs=function(){var e=new this.constructor(this);return e.s<0&&(e.s=1),W(e)},B.ceil=function(){return W(new this.constructor(this),this.e+1,2)},B.clampedTo=B.clamp=function(e,t){var n,r=this,i=r.constructor;if(e=new i(e),t=new i(t),!e.s||!t.s)return new i(NaN);if(e.gt(t))throw Error(rt+t);return n=r.cmp(e),n<0?e:r.cmp(t)>0?t:new i(r)},B.comparedTo=B.cmp=function(e){var t,n,r,i,a=this,o=a.d,s=(e=new a.constructor(e)).d,c=a.s,l=e.s;if(!o||!s)return!c||!l?NaN:c===l?o===s?0:!o^c<0?1:-1:c;if(!o[0]||!s[0])return o[0]?c:s[0]?-l:0;if(c!==l)return c;if(a.e!==e.e)return a.e>e.e^c<0?1:-1;for(r=o.length,i=s.length,t=0,n=r<i?r:i;t<n;++t)if(o[t]!==s[t])return o[t]>s[t]^c<0?1:-1;return r===i?0:r>i^c<0?1:-1},B.cosine=B.cos=function(){var e,t,n=this,r=n.constructor;return n.d?n.d[0]?(e=r.precision,t=r.rounding,r.precision=e+Math.max(n.e,n.sd())+z,r.rounding=1,n=gt(r,At(r,n)),r.precision=e,r.rounding=t,W(P==2||P==3?n.neg():n,e,t,!0)):new r(1):new r(NaN)},B.cubeRoot=B.cbrt=function(){var e,t,n,r,i,a,o,s,c,l,u=this,d=u.constructor;if(!u.isFinite()||u.isZero())return new d(u);for(F=!1,a=u.s*L(u.s*u,1/3),!a||Math.abs(a)==1/0?(n=V(u.d),e=u.e,(a=(e-n.length+1)%3)&&(n+=a==1||a==-2?`0`:`00`),a=L(n,1/3),e=I((e+1)/3)-(e%3==(e<0?-1:2)),a==1/0?n=`5e`+e:(n=a.toExponential(),n=n.slice(0,n.indexOf(`e`)+1)+e),r=new d(n),r.s=u.s):r=new d(a.toString()),o=(e=d.precision)+3;;)if(s=r,c=s.times(s).times(s),l=c.plus(u),r=U(l.plus(u).times(s),l.plus(c),o+2,1),V(s.d).slice(0,o)===(n=V(r.d)).slice(0,o))if(n=n.slice(o-3,o+1),n==`9999`||!i&&n==`4999`){if(!i&&(W(s,e+1,0),s.times(s).times(s).eq(u))){r=s;break}o+=4,i=1}else{(!+n||!+n.slice(1)&&n.charAt(0)==`5`)&&(W(r,e+1,1),t=!r.times(r).times(r).eq(u));break}return F=!0,W(r,e,d.rounding,t)},B.decimalPlaces=B.dp=function(){var e,t=this.d,n=NaN;if(t){if(e=t.length-1,n=(e-I(this.e/z))*z,e=t[e],e)for(;e%10==0;e/=10)n--;n<0&&(n=0)}return n},B.dividedBy=B.div=function(e){return U(this,new this.constructor(e))},B.dividedToIntegerBy=B.divToInt=function(e){var t=this,n=t.constructor;return W(U(t,new n(e),0,1,1),n.precision,n.rounding)},B.equals=B.eq=function(e){return this.cmp(e)===0},B.floor=function(){return W(new this.constructor(this),this.e+1,3)},B.greaterThan=B.gt=function(e){return this.cmp(e)>0},B.greaterThanOrEqualTo=B.gte=function(e){var t=this.cmp(e);return t==1||t===0},B.hyperbolicCosine=B.cosh=function(){var e,t,n,r,i,a=this,o=a.constructor,s=new o(1);if(!a.isFinite())return new o(a.s?1/0:NaN);if(a.isZero())return s;n=o.precision,r=o.rounding,o.precision=n+Math.max(a.e,a.sd())+4,o.rounding=1,i=a.d.length,i<32?(e=Math.ceil(i/3),t=(1/kt(4,e)).toString()):(e=16,t=`2.3283064365386962890625e-10`),a=Ot(o,1,a.times(t),new o(1),!0);for(var c,l=e,u=new o(8);l--;)c=a.times(a),a=s.minus(c.times(u.minus(c.times(u))));return W(a,o.precision=n,o.rounding=r,!0)},B.hyperbolicSine=B.sinh=function(){var e,t,n,r,i=this,a=i.constructor;if(!i.isFinite()||i.isZero())return new a(i);if(t=a.precision,n=a.rounding,a.precision=t+Math.max(i.e,i.sd())+4,a.rounding=1,r=i.d.length,r<3)i=Ot(a,2,i,i,!0);else{e=1.4*Math.sqrt(r),e=e>16?16:e|0,i=i.times(1/kt(5,e)),i=Ot(a,2,i,i,!0);for(var o,s=new a(5),c=new a(16),l=new a(20);e--;)o=i.times(i),i=i.times(s.plus(o.times(c.times(o).plus(l))))}return a.precision=t,a.rounding=n,W(i,t,n,!0)},B.hyperbolicTangent=B.tanh=function(){var e,t,n=this,r=n.constructor;return n.isFinite()?n.isZero()?new r(n):(e=r.precision,t=r.rounding,r.precision=e+7,r.rounding=1,U(n.sinh(),n.cosh(),r.precision=e,r.rounding=t)):new r(n.s)},B.inverseCosine=B.acos=function(){var e=this,t=e.constructor,n=e.abs().cmp(1),r=t.precision,i=t.rounding;return n===-1?e.isZero()?K(t,r+4,i).times(.5):(t.precision=r+6,t.rounding=1,e=new t(1).minus(e).div(e.plus(1)).sqrt().atan(),t.precision=r,t.rounding=i,e.times(2)):n===0?e.isNeg()?K(t,r,i):new t(0):new t(NaN)},B.inverseHyperbolicCosine=B.acosh=function(){var e,t,n=this,r=n.constructor;return n.lte(1)?new r(n.eq(1)?0:NaN):n.isFinite()?(e=r.precision,t=r.rounding,r.precision=e+Math.max(Math.abs(n.e),n.sd())+4,r.rounding=1,F=!1,n=n.times(n).minus(1).sqrt().plus(n),F=!0,r.precision=e,r.rounding=t,n.ln()):new r(n)},B.inverseHyperbolicSine=B.asinh=function(){var e,t,n=this,r=n.constructor;return!n.isFinite()||n.isZero()?new r(n):(e=r.precision,t=r.rounding,r.precision=e+2*Math.max(Math.abs(n.e),n.sd())+6,r.rounding=1,F=!1,n=n.times(n).plus(1).sqrt().plus(n),F=!0,r.precision=e,r.rounding=t,n.ln())},B.inverseHyperbolicTangent=B.atanh=function(){var e,t,n,r,i=this,a=i.constructor;return i.isFinite()?i.e>=0?new a(i.abs().eq(1)?i.s/0:i.isZero()?i:NaN):(e=a.precision,t=a.rounding,r=i.sd(),Math.max(r,e)<2*-i.e-1?W(new a(i),e,t,!0):(a.precision=n=r-i.e,i=U(i.plus(1),new a(1).minus(i),n+e,1),a.precision=e+4,a.rounding=1,i=i.ln(),a.precision=e,a.rounding=t,i.times(.5))):new a(NaN)},B.inverseSine=B.asin=function(){var e,t,n,r,i=this,a=i.constructor;return i.isZero()?new a(i):(t=i.abs().cmp(1),n=a.precision,r=a.rounding,t===-1?(a.precision=n+6,a.rounding=1,i=i.div(new a(1).minus(i.times(i)).sqrt().plus(1)).atan(),a.precision=n,a.rounding=r,i.times(2)):t===0?(e=K(a,n+4,r).times(.5),e.s=i.s,e):new a(NaN))},B.inverseTangent=B.atan=function(){var e,t,n,r,i,a,o,s,c,l=this,u=l.constructor,d=u.precision,f=u.rounding;if(!l.isFinite()){if(!l.s)return new u(NaN);if(d+4<=pt)return o=K(u,d+4,f).times(.5),o.s=l.s,o}else if(l.isZero())return new u(l);else if(l.abs().eq(1)&&d+4<=pt)return o=K(u,d+4,f).times(.25),o.s=l.s,o;for(u.precision=s=d+10,u.rounding=1,n=Math.min(28,s/z+2|0),e=n;e;--e)l=l.div(l.times(l).plus(1).sqrt().plus(1));for(F=!1,t=Math.ceil(s/z),r=1,c=l.times(l),o=new u(l),i=l;e!==-1;)if(i=i.times(c),a=o.minus(i.div(r+=2)),i=i.times(c),o=a.plus(i.div(r+=2)),o.d[t]!==void 0)for(e=t;o.d[e]===a.d[e]&&e--;);return n&&(o=o.times(2<<n-1)),F=!0,W(o,u.precision=d,u.rounding=f,!0)},B.isFinite=function(){return!!this.d},B.isInteger=B.isInt=function(){return!!this.d&&I(this.e/z)>this.d.length-2},B.isNaN=function(){return!this.s},B.isNegative=B.isNeg=function(){return this.s<0},B.isPositive=B.isPos=function(){return this.s>0},B.isZero=function(){return!!this.d&&this.d[0]===0},B.lessThan=B.lt=function(e){return this.cmp(e)<0},B.lessThanOrEqualTo=B.lte=function(e){return this.cmp(e)<1},B.logarithm=B.log=function(e){var t,n,r,i,a,o,s,c,l=this,u=l.constructor,d=u.precision,f=u.rounding,p=5;if(e==null)e=new u(10),t=!0;else{if(e=new u(e),n=e.d,e.s<0||!n||!n[0]||e.eq(1))return new u(NaN);t=e.eq(10)}if(n=l.d,l.s<0||!n||!n[0]||l.eq(1))return new u(n&&!n[0]?-1/0:l.s==1?n?0:1/0:NaN);if(t)if(n.length>1)a=!0;else{for(i=n[0];i%10==0;)i/=10;a=i!==1}if(F=!1,s=d+p,o=J(l,s),r=t?vt(u,s+10):J(e,s),c=U(o,r,s,1),mt(c.d,i=d,f))do if(s+=10,o=J(l,s),r=t?vt(u,s+10):J(e,s),c=U(o,r,s,1),!a){+V(c.d).slice(i+1,i+15)+1==0x5af3107a4000&&(c=W(c,d+1,0));break}while(mt(c.d,i+=10,f));return F=!0,W(c,d,f)},B.minus=B.sub=function(e){var t,n,r,i,a,o,s,c,l,u,d,f,p=this,m=p.constructor;if(e=new m(e),!p.d||!e.d)return!p.s||!e.s?e=new m(NaN):p.d?e.s=-e.s:e=new m(e.d||p.s!==e.s?p:NaN),e;if(p.s!=e.s)return e.s=-e.s,p.plus(e);if(l=p.d,f=e.d,s=m.precision,c=m.rounding,!l[0]||!f[0]){if(f[0])e.s=-e.s;else if(l[0])e=new m(p);else return new m(c===3?-0:0);return F?W(e,s,c):e}if(n=I(e.e/z),u=I(p.e/z),l=l.slice(),a=u-n,a){for(d=a<0,d?(t=l,a=-a,o=f.length):(t=f,n=u,o=l.length),r=Math.max(Math.ceil(s/z),o)+2,a>r&&(a=r,t.length=1),t.reverse(),r=a;r--;)t.push(0);t.reverse()}else{for(r=l.length,o=f.length,d=r<o,d&&(o=r),r=0;r<o;r++)if(l[r]!=f[r]){d=l[r]<f[r];break}a=0}for(d&&(t=l,l=f,f=t,e.s=-e.s),o=l.length,r=f.length-o;r>0;--r)l[o++]=0;for(r=f.length;r>a;){if(l[--r]<f[r]){for(i=r;i&&l[--i]===0;)l[i]=R-1;--l[i],l[r]+=R}l[r]-=f[r]}for(;l[--o]===0;)l.pop();for(;l[0]===0;l.shift())--n;return l[0]?(e.d=l,e.e=_t(l,n),F?W(e,s,c):e):new m(c===3?-0:0)},B.modulo=B.mod=function(e){var t,n=this,r=n.constructor;return e=new r(e),!n.d||!e.s||e.d&&!e.d[0]?new r(NaN):!e.d||n.d&&!n.d[0]?W(new r(n),r.precision,r.rounding):(F=!1,r.modulo==9?(t=U(n,e.abs(),0,3,1),t.s*=e.s):t=U(n,e,0,r.modulo,1),t=t.times(e),F=!0,n.minus(t))},B.naturalExponential=B.exp=function(){return Ct(this)},B.naturalLogarithm=B.ln=function(){return J(this)},B.negated=B.neg=function(){var e=new this.constructor(this);return e.s=-e.s,W(e)},B.plus=B.add=function(e){var t,n,r,i,a,o,s,c,l,u,d=this,f=d.constructor;if(e=new f(e),!d.d||!e.d)return!d.s||!e.s?e=new f(NaN):d.d||(e=new f(e.d||d.s===e.s?d:NaN)),e;if(d.s!=e.s)return e.s=-e.s,d.minus(e);if(l=d.d,u=e.d,s=f.precision,c=f.rounding,!l[0]||!u[0])return u[0]||(e=new f(d)),F?W(e,s,c):e;if(a=I(d.e/z),r=I(e.e/z),l=l.slice(),i=a-r,i){for(i<0?(n=l,i=-i,o=u.length):(n=u,r=a,o=l.length),a=Math.ceil(s/z),o=a>o?a+1:o+1,i>o&&(i=o,n.length=1),n.reverse();i--;)n.push(0);n.reverse()}for(o=l.length,i=u.length,o-i<0&&(i=o,n=u,u=l,l=n),t=0;i;)t=(l[--i]=l[i]+u[i]+t)/R|0,l[i]%=R;for(t&&(l.unshift(t),++r),o=l.length;l[--o]==0;)l.pop();return e.d=l,e.e=_t(l,r),F?W(e,s,c):e},B.precision=B.sd=function(e){var t,n=this;if(e!==void 0&&e!==!!e&&e!==1&&e!==0)throw Error(rt+e);return n.d?(t=yt(n.d),e&&n.e+1>t&&(t=n.e+1)):t=NaN,t},B.round=function(){var e=this,t=e.constructor;return W(new t(e),e.e+1,t.rounding)},B.sine=B.sin=function(){var e,t,n=this,r=n.constructor;return n.isFinite()?n.isZero()?new r(n):(e=r.precision,t=r.rounding,r.precision=e+Math.max(n.e,n.sd())+z,r.rounding=1,n=Dt(r,At(r,n)),r.precision=e,r.rounding=t,W(P>2?n.neg():n,e,t,!0)):new r(NaN)},B.squareRoot=B.sqrt=function(){var e,t,n,r,i,a,o=this,s=o.d,c=o.e,l=o.s,u=o.constructor;if(l!==1||!s||!s[0])return new u(!l||l<0&&(!s||s[0])?NaN:s?o:1/0);for(F=!1,l=Math.sqrt(+o),l==0||l==1/0?(t=V(s),(t.length+c)%2==0&&(t+=`0`),l=Math.sqrt(t),c=I((c+1)/2)-(c<0||c%2),l==1/0?t=`5e`+c:(t=l.toExponential(),t=t.slice(0,t.indexOf(`e`)+1)+c),r=new u(t)):r=new u(l.toString()),n=(c=u.precision)+3;;)if(a=r,r=a.plus(U(o,a,n+2,1)).times(.5),V(a.d).slice(0,n)===(t=V(r.d)).slice(0,n))if(t=t.slice(n-3,n+1),t==`9999`||!i&&t==`4999`){if(!i&&(W(a,c+1,0),a.times(a).eq(o))){r=a;break}n+=4,i=1}else{(!+t||!+t.slice(1)&&t.charAt(0)==`5`)&&(W(r,c+1,1),e=!r.times(r).eq(o));break}return F=!0,W(r,c,u.rounding,e)},B.tangent=B.tan=function(){var e,t,n=this,r=n.constructor;return n.isFinite()?n.isZero()?new r(n):(e=r.precision,t=r.rounding,r.precision=e+10,r.rounding=1,n=n.sin(),n.s=1,n=U(n,new r(1).minus(n.times(n)).sqrt(),e+10,0),r.precision=e,r.rounding=t,W(P==2||P==4?n.neg():n,e,t,!0)):new r(NaN)},B.times=B.mul=function(e){var t,n,r,i,a,o,s,c,l,u=this,d=u.constructor,f=u.d,p=(e=new d(e)).d;if(e.s*=u.s,!f||!f[0]||!p||!p[0])return new d(!e.s||f&&!f[0]&&!p||p&&!p[0]&&!f?NaN:!f||!p?e.s/0:e.s*0);for(n=I(u.e/z)+I(e.e/z),c=f.length,l=p.length,c<l&&(a=f,f=p,p=a,o=c,c=l,l=o),a=[],o=c+l,r=o;r--;)a.push(0);for(r=l;--r>=0;){for(t=0,i=c+r;i>r;)s=a[i]+p[r]*f[i-r-1]+t,a[i--]=s%R|0,t=s/R|0;a[i]=(a[i]+t)%R|0}for(;!a[--o];)a.pop();return t?++n:a.shift(),e.d=a,e.e=_t(a,n),F?W(e,d.precision,d.rounding):e},B.toBinary=function(e,t){return jt(this,2,e,t)},B.toDecimalPlaces=B.toDP=function(e,t){var n=this,r=n.constructor;return n=new r(n),e===void 0?n:(H(e,0,N),t===void 0?t=r.rounding:H(t,0,8),W(n,e+n.e+1,t))},B.toExponential=function(e,t){var n,r=this,i=r.constructor;return e===void 0?n=G(r,!0):(H(e,0,N),t===void 0?t=i.rounding:H(t,0,8),r=W(new i(r),e+1,t),n=G(r,!0,e+1)),r.isNeg()&&!r.isZero()?`-`+n:n},B.toFixed=function(e,t){var n,r,i=this,a=i.constructor;return e===void 0?n=G(i):(H(e,0,N),t===void 0?t=a.rounding:H(t,0,8),r=W(new a(i),e+i.e+1,t),n=G(r,!1,e+r.e+1)),i.isNeg()&&!i.isZero()?`-`+n:n},B.toFraction=function(e){var t,n,r,i,a,o,s,c,l,u,d,f,p=this,m=p.d,h=p.constructor;if(!m)return new h(p);if(l=n=new h(1),r=c=new h(0),t=new h(r),a=t.e=yt(m)-p.e-1,o=a%z,t.d[0]=L(10,o<0?z+o:o),e==null)e=a>0?t:l;else{if(s=new h(e),!s.isInt()||s.lt(l))throw Error(rt+s);e=s.gt(t)?a>0?t:l:s}for(F=!1,s=new h(V(m)),u=h.precision,h.precision=a=m.length*z*2;d=U(s,t,0,1,1),i=n.plus(d.times(r)),i.cmp(e)!=1;)n=r,r=i,i=l,l=c.plus(d.times(i)),c=i,i=t,t=s.minus(d.times(i)),s=i;return i=U(e.minus(n),r,0,1,1),c=c.plus(i.times(l)),n=n.plus(i.times(r)),c.s=l.s=p.s,f=U(l,r,a,1).minus(p).abs().cmp(U(c,n,a,1).minus(p).abs())<1?[l,r]:[c,n],h.precision=u,F=!0,f},B.toHexadecimal=B.toHex=function(e,t){return jt(this,16,e,t)},B.toNearest=function(e,t){var n=this,r=n.constructor;if(n=new r(n),e==null){if(!n.d)return n;e=new r(1),t=r.rounding}else{if(e=new r(e),t===void 0?t=r.rounding:H(t,0,8),!n.d)return e.s?n:e;if(!e.d)return e.s&&=n.s,e}return e.d[0]?(F=!1,n=U(n,e,0,t,1).times(e),F=!0,W(n)):(e.s=n.s,n=e),n},B.toNumber=function(){return+this},B.toOctal=function(e,t){return jt(this,8,e,t)},B.toPower=B.pow=function(e){var t,n,r,i,a,o,s=this,c=s.constructor,l=+(e=new c(e));if(!s.d||!e.d||!s.d[0]||!e.d[0])return new c(L(+s,l));if(s=new c(s),s.eq(1))return s;if(r=c.precision,a=c.rounding,e.eq(1))return W(s,r,a);if(t=I(e.e/z),t>=e.d.length-1&&(n=l<0?-l:l)<=dt)return i=bt(c,s,n,r),e.s<0?new c(1).div(i):W(i,r,a);if(o=s.s,o<0){if(t<e.d.length-1)return new c(NaN);if(e.d[t]&1||(o=1),s.e==0&&s.d[0]==1&&s.d.length==1)return s.s=o,s}return n=L(+s,l),t=n==0||!isFinite(n)?I(l*(Math.log(`0.`+V(s.d))/Math.LN10+s.e+1)):new c(n+``).e,t>c.maxE+1||t<c.minE-1?new c(t>0?o/0:0):(F=!1,c.rounding=s.s=1,n=Math.min(12,(t+``).length),i=Ct(e.times(J(s,r+n)),r),i.d&&(i=W(i,r+5,1),mt(i.d,r,a)&&(t=r+10,i=W(Ct(e.times(J(s,t+n)),t),t+5,1),+V(i.d).slice(r+1,r+15)+1==0x5af3107a4000&&(i=W(i,r+1,0)))),i.s=o,F=!0,c.rounding=a,W(i,r,a))},B.toPrecision=function(e,t){var n,r=this,i=r.constructor;return e===void 0?n=G(r,r.e<=i.toExpNeg||r.e>=i.toExpPos):(H(e,1,N),t===void 0?t=i.rounding:H(t,0,8),r=W(new i(r),e,t),n=G(r,e<=r.e||r.e<=i.toExpNeg,e)),r.isNeg()&&!r.isZero()?`-`+n:n},B.toSignificantDigits=B.toSD=function(e,t){var n=this,r=n.constructor;return e===void 0?(e=r.precision,t=r.rounding):(H(e,1,N),t===void 0?t=r.rounding:H(t,0,8)),W(new r(n),e,t)},B.toString=function(){var e=this,t=e.constructor,n=G(e,e.e<=t.toExpNeg||e.e>=t.toExpPos);return e.isNeg()&&!e.isZero()?`-`+n:n},B.truncated=B.trunc=function(){return W(new this.constructor(this),this.e+1,1)},B.valueOf=B.toJSON=function(){var e=this,t=e.constructor,n=G(e,e.e<=t.toExpNeg||e.e>=t.toExpPos);return e.isNeg()?`-`+n:n};function V(e){var t,n,r,i=e.length-1,a=``,o=e[0];if(i>0){for(a+=o,t=1;t<i;t++)r=e[t]+``,n=z-r.length,n&&(a+=q(n)),a+=r;o=e[t],r=o+``,n=z-r.length,n&&(a+=q(n))}else if(o===0)return`0`;for(;o%10==0;)o/=10;return a+o}function H(e,t,n){if(e!==~~e||e<t||e>n)throw Error(rt+e)}function mt(e,t,n,r){var i,a,o,s;for(a=e[0];a>=10;a/=10)--t;return--t<0?(t+=z,i=0):(i=Math.ceil((t+1)/z),t%=z),a=L(10,z-t),s=e[i]%a|0,r==null?t<3?(t==0?s=s/100|0:t==1&&(s=s/10|0),o=n<4&&s==99999||n>3&&s==49999||s==5e4||s==0):o=(n<4&&s+1==a||n>3&&s+1==a/2)&&(e[i+1]/a/100|0)==L(10,t-2)-1||(s==a/2||s==0)&&(e[i+1]/a/100|0)==0:t<4?(t==0?s=s/1e3|0:t==1?s=s/100|0:t==2&&(s=s/10|0),o=(r||n<4)&&s==9999||!r&&n>3&&s==4999):o=((r||n<4)&&s+1==a||!r&&n>3&&s+1==a/2)&&(e[i+1]/a/1e3|0)==L(10,t-3)-1,o}function ht(e,t,n){for(var r,i=[0],a,o=0,s=e.length;o<s;){for(a=i.length;a--;)i[a]*=t;for(i[0]+=Ze.indexOf(e.charAt(o++)),r=0;r<i.length;r++)i[r]>n-1&&(i[r+1]===void 0&&(i[r+1]=0),i[r+1]+=i[r]/n|0,i[r]%=n)}return i.reverse()}function gt(e,t){var n,r,i;if(t.isZero())return t;r=t.d.length,r<32?(n=Math.ceil(r/3),i=(1/kt(4,n)).toString()):(n=16,i=`2.3283064365386962890625e-10`),e.precision+=n,t=Ot(e,1,t.times(i),new e(1));for(var a=n;a--;){var o=t.times(t);t=o.times(o).minus(o).times(8).plus(1)}return e.precision-=n,t}var U=(function(){function e(e,t,n){var r,i=0,a=e.length;for(e=e.slice();a--;)r=e[a]*t+i,e[a]=r%n|0,i=r/n|0;return i&&e.unshift(i),e}function t(e,t,n,r){var i,a;if(n!=r)a=n>r?1:-1;else for(i=a=0;i<n;i++)if(e[i]!=t[i]){a=e[i]>t[i]?1:-1;break}return a}function n(e,t,n,r){for(var i=0;n--;)e[n]-=i,i=+(e[n]<t[n]),e[n]=i*r+e[n]-t[n];for(;!e[0]&&e.length>1;)e.shift()}return function(r,i,a,o,s,c){var l,u,d,f,p,m,h,g,_,v,y,b,x,S,C,ee,w,te,T,ne,E=r.constructor,re=r.s==i.s?1:-1,D=r.d,O=i.d;if(!D||!D[0]||!O||!O[0])return new E(!r.s||!i.s||(D?O&&D[0]==O[0]:!O)?NaN:D&&D[0]==0||!O?re*0:re/0);for(c?(p=1,u=r.e-i.e):(c=R,p=z,u=I(r.e/p)-I(i.e/p)),T=O.length,w=D.length,_=new E(re),v=_.d=[],d=0;O[d]==(D[d]||0);d++);if(O[d]>(D[d]||0)&&u--,a==null?(S=a=E.precision,o=E.rounding):S=s?a+(r.e-i.e)+1:a,S<0)v.push(1),m=!0;else{if(S=S/p+2|0,d=0,T==1){for(f=0,O=O[0],S++;(d<w||f)&&S--;d++)C=f*c+(D[d]||0),v[d]=C/O|0,f=C%O|0;m=f||d<w}else{for(f=c/(O[0]+1)|0,f>1&&(O=e(O,f,c),D=e(D,f,c),T=O.length,w=D.length),ee=T,y=D.slice(0,T),b=y.length;b<T;)y[b++]=0;ne=O.slice(),ne.unshift(0),te=O[0],O[1]>=c/2&&++te;do f=0,l=t(O,y,T,b),l<0?(x=y[0],T!=b&&(x=x*c+(y[1]||0)),f=x/te|0,f>1?(f>=c&&(f=c-1),h=e(O,f,c),g=h.length,b=y.length,l=t(h,y,g,b),l==1&&(f--,n(h,T<g?ne:O,g,c))):(f==0&&(l=f=1),h=O.slice()),g=h.length,g<b&&h.unshift(0),n(y,h,b,c),l==-1&&(b=y.length,l=t(O,y,T,b),l<1&&(f++,n(y,T<b?ne:O,b,c))),b=y.length):l===0&&(f++,y=[0]),v[d++]=f,l&&y[0]?y[b++]=D[ee]||0:(y=[D[ee]],b=1);while((ee++<w||y[0]!==void 0)&&S--);m=y[0]!==void 0}v[0]||v.shift()}if(p==1)_.e=u,tt=m;else{for(d=1,f=v[0];f>=10;f/=10)d++;_.e=d+u*p-1,W(_,s?a+_.e+1:a,o,m)}return _}})();function W(e,t,n,r){var i,a,o,s,c,l,u,d,f,p=e.constructor;out:if(t!=null){if(d=e.d,!d)return e;for(i=1,s=d[0];s>=10;s/=10)i++;if(a=t-i,a<0)a+=z,o=t,u=d[f=0],c=u/L(10,i-o-1)%10|0;else if(f=Math.ceil((a+1)/z),s=d.length,f>=s)if(r){for(;s++<=f;)d.push(0);u=c=0,i=1,a%=z,o=a-z+1}else break out;else{for(u=s=d[f],i=1;s>=10;s/=10)i++;a%=z,o=a-z+i,c=o<0?0:u/L(10,i-o-1)%10|0}if(r=r||t<0||d[f+1]!==void 0||(o<0?u:u%L(10,i-o-1)),l=n<4?(c||r)&&(n==0||n==(e.s<0?3:2)):c>5||c==5&&(n==4||r||n==6&&(a>0?o>0?u/L(10,i-o):0:d[f-1])%10&1||n==(e.s<0?8:7)),t<1||!d[0])return d.length=0,l?(t-=e.e+1,d[0]=L(10,(z-t%z)%z),e.e=-t||0):d[0]=e.e=0,e;if(a==0?(d.length=f,s=1,f--):(d.length=f+1,s=L(10,z-a),d[f]=o>0?(u/L(10,i-o)%L(10,o)|0)*s:0),l)for(;;)if(f==0){for(a=1,o=d[0];o>=10;o/=10)a++;for(o=d[0]+=s,s=1;o>=10;o/=10)s++;a!=s&&(e.e++,d[0]==R&&(d[0]=1));break}else{if(d[f]+=s,d[f]!=R)break;d[f--]=0,s=1}for(a=d.length;d[--a]===0;)d.pop()}return F&&(e.e>p.maxE?(e.d=null,e.e=NaN):e.e<p.minE&&(e.e=0,e.d=[0])),e}function G(e,t,n){if(!e.isFinite())return wt(e);var r,i=e.e,a=V(e.d),o=a.length;return t?(n&&(r=n-o)>0?a=a.charAt(0)+`.`+a.slice(1)+q(r):o>1&&(a=a.charAt(0)+`.`+a.slice(1)),a=a+(e.e<0?`e`:`e+`)+e.e):i<0?(a=`0.`+q(-i-1)+a,n&&(r=n-o)>0&&(a+=q(r))):i>=o?(a+=q(i+1-o),n&&(r=n-i-1)>0&&(a=a+`.`+q(r))):((r=i+1)<o&&(a=a.slice(0,r)+`.`+a.slice(r)),n&&(r=n-o)>0&&(i+1===o&&(a+=`.`),a+=q(r))),a}function _t(e,t){var n=e[0];for(t*=z;n>=10;n/=10)t++;return t}function vt(e,t,n){if(t>ft)throw F=!0,n&&(e.precision=n),Error(it);return W(new e(Qe),t,1,!0)}function K(e,t,n){if(t>pt)throw Error(it);return W(new e($e),t,n,!0)}function yt(e){var t=e.length-1,n=t*z+1;if(t=e[t],t){for(;t%10==0;t/=10)n--;for(t=e[0];t>=10;t/=10)n++}return n}function q(e){for(var t=``;e--;)t+=`0`;return t}function bt(e,t,n,r){var i,a=new e(1),o=Math.ceil(r/z+4);for(F=!1;;){if(n%2&&(a=a.times(t),Mt(a.d,o)&&(i=!0)),n=I(n/2),n===0){n=a.d.length-1,i&&a.d[n]===0&&++a.d[n];break}t=t.times(t),Mt(t.d,o)}return F=!0,a}function xt(e){return e.d[e.d.length-1]&1}function St(e,t,n){for(var r,i,a=new e(t[0]),o=0;++o<t.length;){if(i=new e(t[o]),!i.s){a=i;break}r=a.cmp(i),(r===n||r===0&&a.s===n)&&(a=i)}return a}function Ct(e,t){var n,r,i,a,o,s,c,l=0,u=0,d=0,f=e.constructor,p=f.rounding,m=f.precision;if(!e.d||!e.d[0]||e.e>17)return new f(e.d?e.d[0]?e.s<0?0:1/0:1:e.s?e.s<0?0:e:NaN);for(t==null?(F=!1,c=m):c=t,s=new f(.03125);e.e>-2;)e=e.times(s),d+=5;for(r=Math.log(L(2,d))/Math.LN10*2+5|0,c+=r,n=a=o=new f(1),f.precision=c;;){if(a=W(a.times(e),c,1),n=n.times(++u),s=o.plus(U(a,n,c,1)),V(s.d).slice(0,c)===V(o.d).slice(0,c)){for(i=d;i--;)o=W(o.times(o),c,1);if(t==null)if(l<3&&mt(o.d,c-r,p,l))f.precision=c+=10,n=a=s=new f(1),u=0,l++;else return W(o,f.precision=m,p,F=!0);else return f.precision=m,o}o=s}}function J(e,t){var n,r,i,a,o,s,c,l,u,d,f,p=1,m=10,h=e,g=h.d,_=h.constructor,v=_.rounding,y=_.precision;if(h.s<0||!g||!g[0]||!h.e&&g[0]==1&&g.length==1)return new _(g&&!g[0]?-1/0:h.s==1?g?0:h:NaN);if(t==null?(F=!1,u=y):u=t,_.precision=u+=m,n=V(g),r=n.charAt(0),Math.abs(a=h.e)<0x5543df729c000){for(;r<7&&r!=1||r==1&&n.charAt(1)>3;)h=h.times(e),n=V(h.d),r=n.charAt(0),p++;a=h.e,r>1?(h=new _(`0.`+n),a++):h=new _(r+`.`+n.slice(1))}else return l=vt(_,u+2,y).times(a+``),h=J(new _(r+`.`+n.slice(1)),u-m).plus(l),_.precision=y,t==null?W(h,y,v,F=!0):h;for(d=h,c=o=h=U(h.minus(1),h.plus(1),u,1),f=W(h.times(h),u,1),i=3;;){if(o=W(o.times(f),u,1),l=c.plus(U(o,new _(i),u,1)),V(l.d).slice(0,u)===V(c.d).slice(0,u))if(c=c.times(2),a!==0&&(c=c.plus(vt(_,u+2,y).times(a+``))),c=U(c,new _(p),u,1),t==null)if(mt(c.d,u-m,v,s))_.precision=u+=m,l=o=h=U(d.minus(1),d.plus(1),u,1),f=W(h.times(h),u,1),i=s=1;else return W(c,_.precision=y,v,F=!0);else return _.precision=y,c;c=l,i+=2}}function wt(e){return String(e.s*e.s/0)}function Tt(e,t){var n,r,i;for((n=t.indexOf(`.`))>-1&&(t=t.replace(`.`,``)),(r=t.search(/e/i))>0?(n<0&&(n=r),n+=+t.slice(r+1),t=t.substring(0,r)):n<0&&(n=t.length),r=0;t.charCodeAt(r)===48;r++);for(i=t.length;t.charCodeAt(i-1)===48;--i);if(t=t.slice(r,i),t){if(i-=r,e.e=n=n-r-1,e.d=[],r=(n+1)%z,n<0&&(r+=z),r<i){for(r&&e.d.push(+t.slice(0,r)),i-=z;r<i;)e.d.push(+t.slice(r,r+=z));t=t.slice(r),r=z-t.length}else r-=i;for(;r--;)t+=`0`;e.d.push(+t),F&&(e.e>e.constructor.maxE?(e.d=null,e.e=NaN):e.e<e.constructor.minE&&(e.e=0,e.d=[0]))}else e.e=0,e.d=[0];return e}function Et(e,t){var n,r,i,a,o,s,c,l,u;if(t.indexOf(`_`)>-1){if(t=t.replace(/(\d)_(?=\d)/g,`$1`),ut.test(t))return Tt(e,t)}else if(t===`Infinity`||t===`NaN`)return+t||(e.s=NaN),e.e=NaN,e.d=null,e;if(ct.test(t))n=16,t=t.toLowerCase();else if(st.test(t))n=2;else if(lt.test(t))n=8;else throw Error(rt+t);for(a=t.search(/p/i),a>0?(c=+t.slice(a+1),t=t.substring(2,a)):t=t.slice(2),a=t.indexOf(`.`),o=a>=0,r=e.constructor,o&&(t=t.replace(`.`,``),s=t.length,a=s-a,i=bt(r,new r(n),a,a*2)),l=ht(t,n,R),u=l.length-1,a=u;l[a]===0;--a)l.pop();return a<0?new r(e.s*0):(e.e=_t(l,u),e.d=l,F=!1,o&&(e=U(e,i,s*4)),c&&(e=e.times(Math.abs(c)<54?L(2,c):xn.pow(2,c))),F=!0,e)}function Dt(e,t){var n,r=t.d.length;if(r<3)return t.isZero()?t:Ot(e,2,t,t);n=1.4*Math.sqrt(r),n=n>16?16:n|0,t=t.times(1/kt(5,n)),t=Ot(e,2,t,t);for(var i,a=new e(5),o=new e(16),s=new e(20);n--;)i=t.times(t),t=t.times(a.plus(i.times(o.times(i).minus(s))));return t}function Ot(e,t,n,r,i){var a,o,s,c,l=1,u=e.precision,d=Math.ceil(u/z);for(F=!1,c=n.times(n),s=new e(r);;){if(o=U(s.times(c),new e(t++*t++),u,1),s=i?r.plus(o):r.minus(o),r=U(o.times(c),new e(t++*t++),u,1),o=s.plus(r),o.d[d]!==void 0){for(a=d;o.d[a]===s.d[a]&&a--;);if(a==-1)break}a=s,s=r,r=o,o=a,l++}return F=!0,o.d.length=d+1,o}function kt(e,t){for(var n=e;--t;)n*=e;return n}function At(e,t){var n,r=t.s<0,i=K(e,e.precision,1),a=i.times(.5);if(t=t.abs(),t.lte(a))return P=r?4:1,t;if(n=t.divToInt(i),n.isZero())P=r?3:2;else{if(t=t.minus(n.times(i)),t.lte(a))return P=xt(n)?r?2:3:r?4:1,t;P=xt(n)?r?1:4:r?3:2}return t.minus(i).abs()}function jt(e,t,n,r){var i,a,o,s,c,l,u,d,f,p=e.constructor,m=n!==void 0;if(m?(H(n,1,N),r===void 0?r=p.rounding:H(r,0,8)):(n=p.precision,r=p.rounding),!e.isFinite())u=wt(e);else{for(u=G(e),o=u.indexOf(`.`),m?(i=2,t==16?n=n*4-3:t==8&&(n=n*3-2)):i=t,o>=0&&(u=u.replace(`.`,``),f=new p(1),f.e=u.length-o,f.d=ht(G(f),10,i),f.e=f.d.length),d=ht(u,10,i),a=c=d.length;d[--c]==0;)d.pop();if(!d[0])u=m?`0p+0`:`0`;else{if(o<0?a--:(e=new p(e),e.d=d,e.e=a,e=U(e,f,n,r,0,i),d=e.d,a=e.e,l=tt),o=d[n],s=i/2,l||=d[n+1]!==void 0,l=r<4?(o!==void 0||l)&&(r===0||r===(e.s<0?3:2)):o>s||o===s&&(r===4||l||r===6&&d[n-1]&1||r===(e.s<0?8:7)),d.length=n,l)for(;++d[--n]>i-1;)d[n]=0,n||(++a,d.unshift(1));for(c=d.length;!d[c-1];--c);for(o=0,u=``;o<c;o++)u+=Ze.charAt(d[o]);if(m){if(c>1)if(t==16||t==8){for(o=t==16?4:3,--c;c%o;c++)u+=`0`;for(d=ht(u,i,t),c=d.length;!d[c-1];--c);for(o=1,u=`1.`;o<c;o++)u+=Ze.charAt(d[o])}else u=u.charAt(0)+`.`+u.slice(1);u=u+(a<0?`p`:`p+`)+a}else if(a<0){for(;++a;)u=`0`+u;u=`0.`+u}else if(++a>c)for(a-=c;a--;)u+=`0`;else a<c&&(u=u.slice(0,a)+`.`+u.slice(a))}u=(t==16?`0x`:t==2?`0b`:t==8?`0o`:``)+u}return e.s<0?`-`+u:u}function Mt(e,t){if(e.length>t)return e.length=t,!0}function Nt(e){return new this(e).abs()}function Pt(e){return new this(e).acos()}function Ft(e){return new this(e).acosh()}function It(e,t){return new this(e).plus(t)}function Lt(e){return new this(e).asin()}function Rt(e){return new this(e).asinh()}function zt(e){return new this(e).atan()}function Bt(e){return new this(e).atanh()}function Vt(e,t){e=new this(e),t=new this(t);var n,r=this.precision,i=this.rounding,a=r+4;return!e.s||!t.s?n=new this(NaN):!e.d&&!t.d?(n=K(this,a,1).times(t.s>0?.25:.75),n.s=e.s):!t.d||e.isZero()?(n=t.s<0?K(this,r,i):new this(0),n.s=e.s):!e.d||t.isZero()?(n=K(this,a,1).times(.5),n.s=e.s):t.s<0?(this.precision=a,this.rounding=1,n=this.atan(U(e,t,a,1)),t=K(this,a,1),this.precision=r,this.rounding=i,n=e.s<0?n.minus(t):n.plus(t)):n=this.atan(U(e,t,a,1)),n}function Ht(e){return new this(e).cbrt()}function Ut(e){return W(e=new this(e),e.e+1,2)}function Wt(e,t,n){return new this(e).clamp(t,n)}function Gt(e){if(!e||typeof e!=`object`)throw Error(nt+`Object expected`);var t,n,r,i=e.defaults===!0,a=[`precision`,1,N,`rounding`,0,8,`toExpNeg`,-Xe,0,`toExpPos`,0,Xe,`maxE`,0,Xe,`minE`,-Xe,0,`modulo`,0,9];for(t=0;t<a.length;t+=3)if(n=a[t],i&&(this[n]=et[n]),(r=e[n])!==void 0)if(I(r)===r&&r>=a[t+1]&&r<=a[t+2])this[n]=r;else throw Error(rt+n+`: `+r);if(n=`crypto`,i&&(this[n]=et[n]),(r=e[n])!==void 0)if(r===!0||r===!1||r===0||r===1)if(r)if(typeof crypto<`u`&&crypto&&(crypto.getRandomValues||crypto.randomBytes))this[n]=!0;else throw Error(at);else this[n]=!1;else throw Error(rt+n+`: `+r);return this}function Kt(e){return new this(e).cos()}function qt(e){return new this(e).cosh()}function Jt(e){var t,n,r;function i(e){var t,n,r,a=this;if(!(a instanceof i))return new i(e);if(a.constructor=i,$t(e)){a.s=e.s,F?!e.d||e.e>i.maxE?(a.e=NaN,a.d=null):e.e<i.minE?(a.e=0,a.d=[0]):(a.e=e.e,a.d=e.d.slice()):(a.e=e.e,a.d=e.d?e.d.slice():e.d);return}if(r=typeof e,r===`number`){if(e===0){a.s=1/e<0?-1:1,a.e=0,a.d=[0];return}if(e<0?(e=-e,a.s=-1):a.s=1,e===~~e&&e<1e7){for(t=0,n=e;n>=10;n/=10)t++;F?t>i.maxE?(a.e=NaN,a.d=null):t<i.minE?(a.e=0,a.d=[0]):(a.e=t,a.d=[e]):(a.e=t,a.d=[e]);return}if(e*0!=0){e||(a.s=NaN),a.e=NaN,a.d=null;return}return Tt(a,e.toString())}if(r===`string`)return(n=e.charCodeAt(0))===45?(e=e.slice(1),a.s=-1):(n===43&&(e=e.slice(1)),a.s=1),ut.test(e)?Tt(a,e):Et(a,e);if(r===`bigint`)return e<0?(e=-e,a.s=-1):a.s=1,Tt(a,e.toString());throw Error(rt+e)}if(i.prototype=B,i.ROUND_UP=0,i.ROUND_DOWN=1,i.ROUND_CEIL=2,i.ROUND_FLOOR=3,i.ROUND_HALF_UP=4,i.ROUND_HALF_DOWN=5,i.ROUND_HALF_EVEN=6,i.ROUND_HALF_CEIL=7,i.ROUND_HALF_FLOOR=8,i.EUCLID=9,i.config=i.set=Gt,i.clone=Jt,i.isDecimal=$t,i.abs=Nt,i.acos=Pt,i.acosh=Ft,i.add=It,i.asin=Lt,i.asinh=Rt,i.atan=zt,i.atanh=Bt,i.atan2=Vt,i.cbrt=Ht,i.ceil=Ut,i.clamp=Wt,i.cos=Kt,i.cosh=qt,i.div=Yt,i.exp=Xt,i.floor=Zt,i.hypot=Qt,i.ln=en,i.log=tn,i.log10=rn,i.log2=nn,i.max=an,i.min=on,i.mod=sn,i.mul=cn,i.pow=ln,i.random=un,i.round=dn,i.sign=fn,i.sin=pn,i.sinh=mn,i.sqrt=hn,i.sub=gn,i.sum=_n,i.tan=vn,i.tanh=yn,i.trunc=bn,e===void 0&&(e={}),e&&e.defaults!==!0)for(r=[`precision`,`rounding`,`toExpNeg`,`toExpPos`,`maxE`,`minE`,`modulo`,`crypto`],t=0;t<r.length;)e.hasOwnProperty(n=r[t++])||(e[n]=this[n]);return i.config(e),i}function Yt(e,t){return new this(e).div(t)}function Xt(e){return new this(e).exp()}function Zt(e){return W(e=new this(e),e.e+1,3)}function Qt(){var e,t,n=new this(0);for(F=!1,e=0;e<arguments.length;)if(t=new this(arguments[e++]),t.d)n.d&&(n=n.plus(t.times(t)));else{if(t.s)return F=!0,new this(1/0);n=t}return F=!0,n.sqrt()}function $t(e){return e instanceof xn||e&&e.toStringTag===ot||!1}function en(e){return new this(e).ln()}function tn(e,t){return new this(e).log(t)}function nn(e){return new this(e).log(2)}function rn(e){return new this(e).log(10)}function an(){return St(this,arguments,-1)}function on(){return St(this,arguments,1)}function sn(e,t){return new this(e).mod(t)}function cn(e,t){return new this(e).mul(t)}function ln(e,t){return new this(e).pow(t)}function un(e){var t,n,r,i,a=0,o=new this(1),s=[];if(e===void 0?e=this.precision:H(e,1,N),r=Math.ceil(e/z),!this.crypto)for(;a<r;)s[a++]=Math.random()*1e7|0;else if(crypto.getRandomValues)for(t=crypto.getRandomValues(new Uint32Array(r));a<r;)i=t[a],i>=429e7?t[a]=crypto.getRandomValues(new Uint32Array(1))[0]:s[a++]=i%1e7;else if(crypto.randomBytes){for(t=crypto.randomBytes(r*=4);a<r;)i=t[a]+(t[a+1]<<8)+(t[a+2]<<16)+((t[a+3]&127)<<24),i>=214e7?crypto.randomBytes(4).copy(t,a):(s.push(i%1e7),a+=4);a=r/4}else throw Error(at);for(r=s[--a],e%=z,r&&e&&(i=L(10,z-e),s[a]=(r/i|0)*i);s[a]===0;a--)s.pop();if(a<0)n=0,s=[0];else{for(n=-1;s[0]===0;n-=z)s.shift();for(r=1,i=s[0];i>=10;i/=10)r++;r<z&&(n-=z-r)}return o.e=n,o.d=s,o}function dn(e){return W(e=new this(e),e.e+1,this.rounding)}function fn(e){return e=new this(e),e.d?e.d[0]?e.s:0*e.s:e.s||NaN}function pn(e){return new this(e).sin()}function mn(e){return new this(e).sinh()}function hn(e){return new this(e).sqrt()}function gn(e,t){return new this(e).sub(t)}function _n(){var e=0,t=arguments,n=new this(t[e]);for(F=!1;n.s&&++e<t.length;)n=n.plus(t[e]);return F=!0,W(n,this.precision,this.rounding)}function vn(e){return new this(e).tan()}function yn(e){return new this(e).tanh()}function bn(e){return W(e=new this(e),e.e+1,1)}B[Symbol.for(`nodejs.util.inspect.custom`)]=B.toString,B[Symbol.toStringTag]=`Decimal`;var xn=B.constructor=Jt(et);Qe=new xn(Qe),$e=new xn($e);function Sn(e){if(e.includes(`e+`)){let[t,n]=e.split(`e+`);return`${Number(t.substring(0,6)).toFixed(3)}e${n}`}let t=xn(e);if(t.lessThan(1e4))return new Intl.NumberFormat(`en`,{maximumFractionDigits:1}).format(t.toNumber());if(t.lessThan(0xe8d4a51000))return new Intl.NumberFormat(`en`,{maximumFractionDigits:0}).format(t.toNumber());let n=t.div(10**(e.length-1)).toPrecision(4).toString();return`${(n+(n.includes(`.`)?``:`.`)).padEnd(5,`0`)}e${String(e.length-1)}`}function Cn({chips:e,multiplier:t,phase:n,card:r,joker:i,type:a,trigger:o},s){let c=``;if(e){let[t,n]=e;t===`*`&&n===1||t===`+`&&n===0||(c+=` chips ${t}${n}`)}if(t){let[e,n]=t;e===`*`&&n===1||e===`+`&&n===0||(c+=` mult  ${e}${n}`)}if(c===``)return``;let l=`${`${n}:`.padEnd(13)}${c}`;return i?(l+=` from ${i}`,r&&(l+=` for ${r}`)):r&&(l+=` from ${r}`),a&&(l+=`'s ${a}`),o&&o!==`Regular`&&(l+=` (trigger: ${o})`),l+` → ${s.chips}×${s.multiplier}`}xn.set({precision:64});function wn(e,t){let n=xn(0),r=xn(0),i=[];for(let t of e){if(t.chips){let[e,r]=t.chips;n=n[e===`+`?`add`:`mul`](r)}if(t.multiplier){let[e,n]=t.multiplier;r=r[e===`+`?`add`:`mul`](n)}let e=Cn(t,{chips:n.toString(),multiplier:r.toString()});e!==``&&i.push(e)}let a;return a=t===`Plasma Deck`?n.add(r).div(2).pow(2):n.mul(r),{score:(a.greaterThan(1e4)?a.floor():a).toString(),log:i}}function Tn(e){let t=En(e),n=t.cards.filter(e=>e.played),{playedHand:r,scoringCards:i}=_e(n,t.jokerSet),a=t.jokerSet.has(`Splash`)?n:i;return{hand:r,scoringCards:a,results:Le.map(e=>{let{score:n,log:i}=wn(Dn(t,r,a,e),t.deck);return{score:n,formattedScore:Sn(n),luck:e,log:i}})}}function En(e){return{...e,jokers:e.jokers.flatMap(e=>Array.from({length:e.count??1},()=>e)),cards:e.cards.flatMap(e=>Array.from({length:e.count??1},()=>e))}}function Dn(e,t,n,r){let i=e.handBaseScores[t],a=e.blind.name===`The Flint`&&e.blind.active?.5:1,o=[];o.push({chips:[`+`,Math.round(i.chips*a)],phase:`base`}),o.push({multiplier:[`+`,Math.round(i.multiplier*a)],phase:`base`});for(let[i,a]of n.entries())for(let s of On({state:e,card:a,index:i})){if(a.debuffed){a.enhancement===`Stone`&&o.push({chips:[`+`,50],phase:`played-cards`,card:a,type:`enhancement`,trigger:s});continue}switch(a.enhancement!==`Stone`&&o.push({chips:[`+`,Be[a.rank]],phase:`played-cards`,card:a,type:`rank`,trigger:s}),a.enhancement){case`Stone`:o.push({chips:[`+`,50],phase:`played-cards`,card:a,type:`enhancement`,trigger:s});break;case`Bonus`:o.push({chips:[`+`,30],phase:`played-cards`,card:a,type:`enhancement`,trigger:s});break;case`Mult`:o.push({multiplier:[`+`,4],phase:`played-cards`,card:a,type:`enhancement`,trigger:s});break;case`Lucky`:{let t=ge(20,e.jokers.filter(({name:e})=>e===`Oops! All 6s`).length,5,r,`plus`);o.push({multiplier:[`+`,t],phase:`played-cards`,card:a,type:`enhancement`,trigger:s});break}case`Glass`:o.push({multiplier:[`*`,2],phase:`played-cards`,card:a,type:`enhancement`,trigger:s});break}switch(a.edition){case`Foil`:o.push({chips:[`+`,50],phase:`played-cards`,card:a,type:`edition`,trigger:s});break;case`Holographic`:o.push({multiplier:[`+`,10],phase:`played-cards`,card:a,type:`edition`,trigger:s});break;case`Polychrome`:o.push({multiplier:[`*`,1.5],phase:`played-cards`,card:a,type:`edition`,trigger:s});break}for(let i of e.jokers)if(i.playedCardEffect)for(let s of An({state:e,joker:i}))i.playedCardEffect({state:e,playedHand:t,scoringCards:n,score:o,card:a,luck:r,trigger:s})}for(let i of e.cards.filter(({played:e})=>!e))if(!i.debuffed)for(let a of kn({state:e,card:i})){switch(i.enhancement){case`Steel`:o.push({multiplier:[`*`,1.5],phase:`held-cards`,card:i,type:`enhancement`,trigger:a});break}for(let a of e.jokers)if(a.heldCardEffect)for(let s of An({state:e,joker:a}))a.heldCardEffect({state:e,playedHand:t,scoringCards:n,score:o,card:i,luck:r,trigger:s})}for(let i of e.jokers){switch(i.edition){case`Foil`:o.push({chips:[`+`,50],phase:`jokers`,joker:i,type:`edition`});break;case`Holographic`:o.push({multiplier:[`+`,10],phase:`jokers`,joker:i,type:`edition`});break}if(i.effect&&i.effect({state:e,playedHand:t,scoringCards:n,score:o,luck:r,trigger:`Regular`}),i.indirectEffect)for(let a of e.jokers)i.indirectEffect({state:e,playedHand:t,scoringCards:n,score:o,joker:a,luck:r,trigger:`Regular`});switch(i.edition){case`Polychrome`:o.push({multiplier:[`*`,1.5],phase:`jokers`,joker:i,type:`edition`});break}}let s=e.observatory[t]??0;return s>0&&o.push({multiplier:[`*`,1.5**s],phase:`consumables`}),o}function On({state:e,card:t,index:n}){let r=[`Regular`];t.seal===`Red`&&r.push(`Red Seal`);for(let i of e.jokers){let a=De(e.jokers,i);if(a!==void 0)switch(a.name){case`Dusk`:e.hands===1&&r.push(a.name);break;case`Hack`:Ee(t,[`2`,`3`,`4`,`5`])&&r.push(a.name);break;case`Hanging Chad`:n===0&&r.push(a.name,a.name);break;case`Seltzer`:r.push(a.name);break;case`Sock and Buskin`:Te(t,e.jokerSet)&&r.push(a.name);break}}return r}function kn({state:e,card:t}){let n=[`Regular`];t.seal===`Red`&&n.push(`Red Seal`);for(let t of e.jokers){let r=De(e.jokers,t);if(r!==void 0)switch(r.name){case`Mime`:n.push(r.name);break}}return n}function An(e){let t=[`Regular`];for(let n of e.state.jokers)if([`Blueprint`,`Brainstorm`].includes(n.name)){let r=De(e.state.jokers,n);if(r===void 0)continue;r.index===e.joker.index&&t.push(n.name)}return t}var jn=await new CSSStyleSheet().replace(`
	hand-level-card {
		display: block;
		inline-size: initial;
	}

	@media (prefers-contrast: more) {
		hand-level-card {
			--c-text: var(--c-black);
			--c-border: var(--c-black);
			--c-background-light: var(--c-grey-light);
			--c-background-lighter: var(--c-white);
		}
	}

	.hlc-level-input,
	.hlc-plays-input {
		text-align: right;
		inline-size: 2.5rem;
	}
`),Mn=class e extends k{static{window.customElements.get(`hand-level-card`)===void 0&&(window.customElements.define(`hand-level-card`,e),document.adoptedStyleSheets.push(jn))}#e;#t;#n;constructor(e,t){super(),this.#e=e??`High Card`,this.#t=t?.level??1,this.#n=t?.plays??0}get handName(){return this.#e}set handName(e){this.#e=e,this.queueRender()}get level(){return this.#t}set level(e){this.#t=e,this.queueRender()}get plays(){return this.#n}set plays(e){this.#n=e,this.queueRender()}template(){return x`
			<fieldset class="stack">
				<legend>${this.handName}</legend>

				<div class="stack">
					<div class="input-list">
						<label class="control-box --flat --grow">
							<span class="label">
								<span aria-hidden="true">lvl</span>
								<span class="visually-hidden">Level</span>
							</span>

							<input
								class="hlc-level-input text-input"
								type="number"
								value="1"
								.value="${this.level}"
								min="1"
								@change="${e=>{let t=e.target;this.level=Number(t.value)}}"
							>
						</label>

						<label class="hlc-plays control-box --flat --grow">
							<span class="label">
								<span aria-hidden="true">#</span>
								<span class="visually-hidden">Number of plays</span>
							</span>

							<input
								class="hlc-plays-input text-input"
								type="number"
								value="0"
								.value="${this.plays}"
								min="0"
								@change="${e=>{let t=e.target;this.plays=Number(t.value)}}"
							>
						</label>
					</div>
				</div>
			</fieldset>
		`}},Nn=new Set,Pn=!1,Fn=`dragged-element-id:`,In=null,Ln=class extends k{#e;constructor(){super(),this.addEventListener(`dragstart`,this.#t),this.addEventListener(`dragend`,this.#n),this.addEventListener(`drop`,this.#i)}connectedCallback(){if(!this.isConnected)return;let e=this.closest(`[data-drop-zone]`);if(!e)throw Error(`<${this.tagName.toLowerCase()} id="${this.id}"> is a DraggableCard but is not an descendant of an element with the “data-drop-zone” attribute.`);this.#e=e,Nn.has(this.#e)||(Nn.add(this.#e),this.#e.addEventListener(`dragenter`,this.#r),this.#e.addEventListener(`dragover`,this.#r))}disconnectedCallback(){this.#e&&=(Nn.delete(this.#e),this.#e.removeEventListener(`dragenter`,this.#r),this.#e.removeEventListener(`dragover`,this.#r),void 0)}#t=e=>{if(e.dataTransfer===null||!(e.target instanceof Element)||!this.#e)return;let t=Array.from(this.#e.children).find(t=>t===e.target);t&&(Pn=!0,e.dataTransfer.effectAllowed=`move`,e.dataTransfer.dropEffect=`move`,e.dataTransfer.setData(`${Fn}${t.id}`,t.id))};#n=e=>{if(!this.#e)return;let t=Rn(e,this.#e);if(t){zn(this.#e,t,e.clientX);for(let e of this.#e.children)e instanceof k&&e.queueRender();Pn=!1}};#r=e=>{if(!this.#e)return;let t=Rn(e,this.#e);t&&(e.preventDefault(),In=t.id)};#i=e=>{Pn&&e.preventDefault()}};function Rn(e,t){if(e.dataTransfer===null||!(e.target instanceof Element))return null;let n=e.dataTransfer.types.find(e=>e.startsWith(Fn)),r=n?n.substring(19):In;if(In=null,r&&t){let e=Array.from(t.children).find(e=>e.id===r);if(e)return e}return null}function zn(e,t,n){let r=e.getBoundingClientRect(),i=n-r.left;for(let n of e.children){let{left:e,width:a}=n.getBoundingClientRect();if(i<e-r.left+a/2){n.insertAdjacentElement(`beforebegin`,t);return}}e.insertAdjacentElement(`beforeend`,t)}var Bn=await new CSSStyleSheet().replace(`
	joker-card {
		--c-text: var(--c-black);
		--c-border: var(--c-red-dark);
		--c-background-light: var(--c-red-light);
		--c-background-lighter: var(--c-red-lighter);

		display: block;
	}

	@media (prefers-contrast: more) {
		joker-card {
			--c-border: var(--c-black);
			--c-background-light: var(--c-grey-light);
			--c-background-lighter: var(--c-white);
		}
	}

	joker-card:where([draggable="true"]) {
		cursor: ew-resize;
	}

	.jc-count-input {
		inline-size: 3.5rem;
		text-align: right;
	}

	.jc-edition-input {
		inline-size: 8.5rem;
	}

	joker-card:not(.--has-plus-chips):not(.--has-plus-multiplier):not(.--has-times-multiplier):not(.--has-is-active):not(.--has-rank):not(.--has-suit) .jc-effects {
		display: none;
	}

	joker-card:not(.--has-plus-chips) .jc-plus-chips {
		display: none;
	}

	joker-card:not(.--has-plus-multiplier) .jc-plus-multiplier {
		display: none;
	}

	joker-card:not(.--has-times-multiplier) .jc-times-multiplier {
		display: none;
	}

	joker-card:not(.--has-is-active) .jc-is-active {
		display: none;
	}

	joker-card:not(.--has-rank):not(.--has-suit) .jc-card {
		display: none;
	}

	joker-card:not(.--has-rank) .jc-rank {
		display: none;
	}

	.jc-rank-input {
		inline-size: 5rem;
	}

	.jc-card-of {
		text-align: center;
	}

	joker-card.--has-rank:not(.--has-suit) .jc-card-of,
	joker-card:not(.--has-rank).--has-suit .jc-card-of {
		display: none;
	}

	joker-card:not(.--has-suit) .jc-suit {
		display: none;
	}

	.jc-suit-input {
		inline-size: 8rem;
	}

	.jc-plus-chips-input {
		inline-size: 7rem;
		text-align: right;
	}

	.jc-plus-multiplier-input {
		inline-size: 7rem;
		text-align: right;
	}

	.jc-times-multiplier-input {
		inline-size: 7rem;
		text-align: right;
	}
`),Vn=class e extends Ln{static{window.customElements.get(`joker-card`)===void 0&&(window.customElements.define(`joker-card`,e),document.adoptedStyleSheets.push(Bn))}#e;#t;#n;#r;#i;#a;#o;#s;#c;constructor(e){super(),this.#e=`8 Ball`,this.#t=1,this.#n=`Base`,this.#r=0,this.#i=0,this.#a=1,this.#o=!0,this.#s=`Ace`,this.#c=`Clubs`,this.#l=(e,t)=>{this.parentElement&&e instanceof k&&t instanceof k&&(this.parentElement.insertBefore(e,t),e.queueRender(),t.queueRender())},this.showDuplicateModal=e=>{let t=e.currentTarget,n=document.querySelector(`dialog[id="${t.getAttribute(`popovertarget`)}"]`);n instanceof HTMLDialogElement&&(n.setAttribute(`data-duplicate-target-id`,this.id),n.showModal())},this.id||=`${this.tagName.toLowerCase()}-${this.uniqueId}`,this.classList.add(`card`),this.draggable=!0,e&&(this.jokerName=e.name,this.count=e.count,this.edition=e.edition,this.plusChips=e.plusChips,this.plusMultiplier=e.plusMultiplier,this.timesMultiplier=e.timesMultiplier,this.active=e.active,e.rank&&(this.rank=e.rank),e.suit&&(this.suit=e.suit))}get jokerName(){return this.#e}set jokerName(e){this.#e=e;let t=He[this.jokerName];this.classList[t.hasPlusChipsInput?`add`:`remove`](`--has-plus-chips`),this.classList[t.hasPlusMultiplierInput?`add`:`remove`](`--has-plus-multiplier`),this.classList[t.hasTimesMultiplierInput?`add`:`remove`](`--has-times-multiplier`),this.classList[t.hasIsActiveInput?`add`:`remove`](`--has-is-active`),this.classList[t.hasRankInput?`add`:`remove`](`--has-rank`),this.classList[t.hasSuitInput?`add`:`remove`](`--has-suit`),this.queueRender()}get count(){return this.#t}set count(e){this.#t=e,this.queueRender()}get edition(){return this.#n}set edition(e){this.#n=e,this.queueRender()}get plusChips(){return this.#r}set plusChips(e){this.#r=e,this.queueRender()}get plusMultiplier(){return this.#i}set plusMultiplier(e){this.#i=e,this.queueRender()}get timesMultiplier(){return this.#a}set timesMultiplier(e){this.#a=e,this.queueRender()}get rank(){return this.#s}set rank(e){this.#s=e,this.queueRender()}get suit(){return this.#c}set suit(e){this.#c=e,this.queueRender()}get active(){return this.#o}set active(e){this.#o=e,this.queueRender()}connectedCallback(){super.connectedCallback(),this.isConnected&&this.render()}template(){return x`
			<div class="stack">
				<div class="action-list">
					<button
						class="button --icon"
						?disabled="${this.previousElementSibling===null}"
						type="button"
						@click="${()=>this.#l(this,this.previousElementSibling)}"
					>
						<span class="visually-hidden">Move joker left</span>

						<svg class="icon">
							<use xlink:href="#arrow-left-icon"></use>
						</svg>
					</button>

					<button
						class="button --icon push-inline-start"
						type="button"
						@click="${()=>this.remove()}"
					>
						<span class="visually-hidden">Remove joker</span>

						<svg class="icon">
							<use xlink:href="#trash-icon"></use>
						</svg>
					</button>

					<button
						class="button --icon"
						?disabled="${this.nextElementSibling===null}"
						type="button"
						@click="${()=>this.#l(this.nextElementSibling,this)}"
					>
						<span class="visually-hidden">Move joker right</span>

						<svg class="icon">
							<use xlink:href="#arrow-right-icon"></use>
						</svg>
					</button>
				</div>

				<label>
					<span class="visually-hidden">Joker name</span>

					<combo-box
						id="joker-name-${this.uniqueId}"
						name="joker-name-${this.uniqueId}"
						class="jc-name-input"
						value="8 Ball"
						.value="${this.jokerName}"
						options-json="jokersJson"
						button-label="Show joker options"
						input-label="Filter jokers"
						listbox-label="Jokers"
						@change="${e=>{let t=e.target;this.jokerName=t.value}}"
					></combo-box>
				</label>

				<div class="action-list">
					<label class="control-box --flat --grow">
						<span class="label truncate">Count</span>
						<input
							id="joker-count-${this.uniqueId}"
							class="jc-count-input text-input"
							type="number"
							value="1"
							.value="${this.count}"
							min="0"
							@change="${e=>{let t=e.target;this.count=Number(t.value)}}"
						>
						<span class="label truncate" aria-hidden="true">×</span>
					</label>

					<button
						class="button --icon"
						type="button"
						popovertarget="jc-duplicate-modal"
						@click="${e=>this.showDuplicateModal(e)}"
					>
						<span class="visually-hidden">Duplicate joker</span>

						<svg class="icon">
							<use xlink:href="#copy-icon"></use>
						</svg>
					</button>
				</div>

				<label class="control-box --flat --grow">
					<span class="label truncate">Edition</span>

					<select
						id="joker-edition-${this.uniqueId}"
						name="joker-edition-${this.uniqueId}"
						.value="${this.edition}"
						class="jc-edition-input select"
						@change="${e=>{let t=e.target;this.edition=t.value}}"
					>
						<option value="Base" selected>Base</option>
						<option value="Foil">Foil</option>
						<option value="Holographic">Holographic</option>
						<option value="Polychrome">Polychrome</option>
						<option value="Negative">Negative</option>
					</select>
				</label>

				<div class="jc-effects stack">
					<label class="jc-plus-chips control-box --flat --grow">
						<span class="label truncate">+Chips</span>

						<input
							name="joker-plusChips-${this.uniqueId}"
							class="jc-plus-chips-input text-input"
							type="number"
							value="0"
							.value="${this.plusChips}"
							min="0"
							@change="${e=>{let t=e.target;this.plusChips=Number(t.value)}}"
						>
					</label>

					<label class="jc-plus-multiplier control-box --flat --grow">
						<span class="label truncate">+Mult</span>

						<input
							name="joker-plusMultiplier-${this.uniqueId}"
							class="jc-plus-multiplier-input text-input"
							type="number"
							value="0"
							.value="${this.plusMultiplier}"
							min="0"
							@change="${e=>{let t=e.target;this.plusMultiplier=Number(t.value)}}"
						>
					</label>

					<label class="jc-times-multiplier control-box --flat --grow">
						<span class="label truncate">xMult</span>

						<input
							name="joker-timesMultiplier-${this.uniqueId}"
							class="jc-times-multiplier-input text-input"
							type="number"
							value="1"
							.value="${this.timesMultiplier}"
							min="1"
							step="0.05"
							@change="${e=>{let t=e.target;this.timesMultiplier=Number(t.value)}}"
						>
					</label>

					<label class="jc-is-active checkbox-control">
						<input
							name="joker-active-${this.uniqueId}"
							class="jc-is-active-input"
							type="checkbox"
							value="is-active"
							checked
							.checked="${this.active}"
							@change="${e=>{let t=e.target;this.active=t.checked}}"
						>

						<span class="label">Active?</span>
					</label>

					<div class="jc-card input-list">
						<label class="jc-rank">
							<span class="visually-hidden">Rank</span>

							<select
								id="joker-rank-${this.uniqueId}"
								name="joker-rank-${this.uniqueId}"
								class="jc-rank-input select"
								.value="${this.rank}"
								@change="${e=>{let t=e.target;this.rank=t.value}}"
							>
								<option value="Ace" selected>Ace</option>
								<option value="King">King</option>
								<option value="Queen">Queen</option>
								<option value="Jack">Jack</option>
								<option value="10">10</option>
								<option value="9">9</option>
								<option value="8">8</option>
								<option value="7">7</option>
								<option value="6">6</option>
								<option value="5">5</option>
								<option value="4">4</option>
								<option value="3">3</option>
								<option value="2">2</option>
							</select>
						</label>

						<span class="jc-card-of">of</span>

						<label class="jc-suit">
							<span class="visually-hidden">Suit</span>

							<select
								id="joker-suit-${this.uniqueId}"
								name="joker-suit-${this.uniqueId}"
								class="jc-suit-input select"
								.value="${this.suit}"
								@change="${e=>{let t=e.target;this.suit=t.value}}"
							>
								<button><selectedcontent></selectedcontent></button>
								<option value="Clubs" selected>
									<svg aria-hidden="true" class="icon --small">
										<use xlink:href="#clubs-icon"></use>
									</svg>
									Clubs
								</option>
								<option value="Spades">
									<svg aria-hidden="true" class="icon --small">
										<use xlink:href="#spades-icon"></use>
									</svg>
									Spades
								</option>
								<option value="Hearts">
									<svg aria-hidden="true" class="icon --small">
										<use xlink:href="#hearts-icon"></use>
									</svg>
									Hearts
								</option>
								<option value="Diamonds">
									<svg aria-hidden="true" class="icon --small">
										<use xlink:href="#diamonds-icon"></use>
									</svg>
									Diamonds
								</option>
							</select>
						</label>
					</div>
				</div>
			</div>
		`}#l;clone(){return new e({name:this.jokerName,edition:this.edition,plusChips:this.plusChips,plusMultiplier:this.plusMultiplier,timesMultiplier:this.timesMultiplier,active:this.active,count:this.count,rank:this.rank,suit:this.suit})}},Hn=await new CSSStyleSheet().replace(`
	playing-card {
		--c-text: var(--c-black);
		--c-border: var(--c-yellow-dark);
		--c-background-light: var(--c-yellow-light);
		--c-background-lighter: var(--c-yellow-lighter);

		display: block;
	}

	@media (prefers-contrast: more) {
		playing-card {
			--c-border: var(--c-black);
			--c-background-light: var(--c-grey-light);
			--c-background-lighter: var(--c-white);
		}
	}

	playing-card:where([draggable="true"]) {
		cursor: ew-resize;
	}

	playing-card:where(.--is-played) {
		margin-block-end: 1.5rem;
	}

	playing-card:not(:where(.--is-played)) {
		margin-block-start: 1.5rem;
	}

	playing-card:not(.--is-blind-the-pillar) .pc-is-debuffed {
		display: none;
	}

	.pc-rank-input {
		inline-size: 5rem;
	}

	.pc-suit-input {
		inline-size: 8rem;
	}

	.pc-card-of {
		text-align: center;
	}

	.pc-count-input {
		inline-size: 3.5rem;
		text-align: right;
	}

	.pc-edition-input {
		inline-size: 8.5rem;
	}

	.pc-enhancement-input {
		inline-size: 5.5rem;
	}

	.pc-seal-input {
		inline-size: 5.5rem;
	}

	.pc-seal-orb {
		background-color: var(--seal-color, transparent);
		border: 1px solid #000;
		border-radius: 50%;
		display: block;
		block-size: 1rem;
		inline-size: 1rem;
	}
`),Un=class e extends Ln{static{window.customElements.get(`playing-card`)===void 0&&(window.customElements.define(`playing-card`,e),document.adoptedStyleSheets.push(Hn))}#e;#t;#n;#r;#i;#a;#o;#s;constructor(e){super(),this.#e=!0,this.#t=1,this.#n=!1,this.#r=`Ace`,this.#i=`Clubs`,this.#a=`Base`,this.#o=`None`,this.#s=`None`,this.#c=(e,t)=>{this.parentElement&&e instanceof k&&t instanceof k&&(this.parentElement.insertBefore(e,t),e.queueRender(),t.queueRender())},this.showDuplicateModal=e=>{let t=e.currentTarget,n=document.querySelector(`dialog[id="${t.getAttribute(`popovertarget`)}"]`);n instanceof HTMLDialogElement&&(n.setAttribute(`data-duplicate-target-id`,this.id),n.showModal())},this.id||=`${this.tagName.toLowerCase()}-${this.uniqueId}`,this.classList.add(`card`,`--is-played`),this.draggable=!0,e&&(this.played=e.played,this.count=e.count,this.debuffed=e.debuffed,this.rank=e.rank,this.suit=e.suit,this.edition=e.edition,this.enhancement=e.enhancement,this.seal=e.seal),this.addEventListener(`click`,e=>{e.isTrusted&&!Wn(e)&&(this.played=!this.played)},{capture:!0})}get card(){return{index:this.parentElement.children.length,rank:this.rank,suit:this.suit,edition:this.edition,enhancement:this.enhancement,seal:this.seal,debuffed:this.debuffed,played:this.played,count:this.count}}get rank(){return this.#r}set rank(e){this.#r=e,this.queueRender()}get suit(){return this.#i}set suit(e){this.#i=e,this.queueRender()}get edition(){return this.#a}set edition(e){this.#a=e,this.queueRender()}get enhancement(){return this.#o}set enhancement(e){this.#o=e,this.queueRender()}get seal(){return this.#s}set seal(e){this.#s=e,this.queueRender()}get played(){return this.#e}set played(e){this.#e=e,this.classList[this.played?`add`:`remove`](`--is-played`),this.queueRender()}get debuffed(){return this.#n}set debuffed(e){this.#n=e,this.classList[this.debuffed?`add`:`remove`](`--is-debuffed`),this.queueRender()}get count(){return this.#t}set count(e){this.#t=e,this.queueRender()}connectedCallback(){super.connectedCallback(),this.isConnected&&this.render()}template(){return x`
			<div class="stack">
				<div class="action-list">
					<button
						class="button --icon"
						?disabled="${this.previousElementSibling===null}"
						type="button"
						@click="${()=>this.#c(this,this.previousElementSibling)}"
					>
						<span class="visually-hidden">Move card left</span>

						<svg class="icon">
							<use xlink:href="#arrow-left-icon"></use>
						</svg>
					</button>

					<label class="checkbox-control">
						<input
							name="card-is-played-${this.uniqueId}"
							type="checkbox"
							value="is-played"
							checked
							.checked="${this.played}"
							@change="${e=>{let t=e.target;this.played=t.checked}}"
						>

						<span class="label">Play?</span>
					</label>

					<button
						class="button --icon push-inline-start"
						type="button"
						@click="${()=>this.remove()}"
					>
						<span class="visually-hidden">Remove playing card</span>

						<svg class="icon">
							<use xlink:href="#trash-icon"></use>
						</svg>
					</button>

					<button
						class="button --icon"
						?disabled="${this.nextElementSibling===null}"
						type="button"
						@click="${()=>this.#c(this.nextElementSibling,this)}"
					>
						<span class="visually-hidden">Move card right</span>

						<svg class="icon">
							<use xlink:href="#arrow-right-icon"></use>
						</svg>
					</button>
				</div>

				<div class="input-list">
					<label class="control-box">
						<span class="visually-hidden">Rank</span>

						<select
							class="pc-rank-input select"
							id="card-rank-${this.uniqueId}"
							name="card-rank-${this.uniqueId}"
							.value="${this.rank}"
							@change="${e=>{let t=e.target;this.rank=t.value}}"
						>
							<option value="Ace" selected>Ace</option>
							<option value="King">King</option>
							<option value="Queen">Queen</option>
							<option value="Jack">Jack</option>
							<option value="10">10</option>
							<option value="9">9</option>
							<option value="8">8</option>
							<option value="7">7</option>
							<option value="6">6</option>
							<option value="5">5</option>
							<option value="4">4</option>
							<option value="3">3</option>
							<option value="2">2</option>
						</select>
					</label>

					<span class="pc-card-of">of</span>

					<label class="control-box">
						<span class="visually-hidden">Suit</span>

						<select
							class="pc-suit-input select"
							id="card-suit-${this.uniqueId}"
							name="card-suit-${this.uniqueId}"
							.value="${this.suit}"
							@change="${e=>{let t=e.target;this.suit=t.value}}"
						>
							<button><selectedcontent></selectedcontent></button>
							<option value="Clubs" selected>
								<svg aria-hidden="true" class="icon --small">
									<use xlink:href="#clubs-icon"></use>
								</svg>
								Clubs
							</option>
							<option value="Spades">
								<svg aria-hidden="true" class="icon --small">
									<use xlink:href="#spades-icon"></use>
								</svg>
								Spades
							</option>
							<option value="Hearts">
								<svg aria-hidden="true" class="icon --small">
									<use xlink:href="#hearts-icon"></use>
								</svg>
								Hearts
							</option>
							<option value="Diamonds">
								<svg aria-hidden="true" class="icon --small">
									<use xlink:href="#diamonds-icon"></use>
								</svg>
								Diamonds
							</option>
						</select>
					</label>
				</div>

				<div class="action-list">
					<label class="control-box --flat --grow">
						<span class="label truncate">Count</span>
						<input
							class="pc-count-input text-input"
							name="card-count-${this.uniqueId}"
							type="number"
							value="1"
							.value="${this.count}"
							min="1"
							@change="${e=>{let t=e.target;this.count=Number(t.value)}}"
						>
						<span class="label truncate" aria-hidden="true">×</span>
					</label>

					<button
						class="button --icon push-inline-start"
						type="button"
						popovertarget="pc-duplicate-modal"
						@click="${e=>this.showDuplicateModal(e)}"
					>
						<span class="visually-hidden">Duplicate card</span>

						<svg class="icon">
							<use xlink:href="#copy-icon"></use>
						</svg>
					</button>
				</div>

				<label class="pc-is-debuffed checkbox-control">
					<input
						class="pc-is-debuffed-input"
						name="card-is-debuffed-${this.uniqueId}"
						type="checkbox"
						value="is-debuffed"
						.checked="${this.debuffed}"
						@change="${e=>{let t=e.target;this.debuffed=t.checked}}"
					>

					<span class="label">Debuffed?</span>
				</label>

				<label class="control-box --flat --grow">
					<span class="label truncate">Edition</span>

					<select
						class="pc-edition-input select"
						id="card-edition-${this.uniqueId}"
						name="card-edition-${this.uniqueId}"
						.value="${this.edition}"
						@change="${e=>{let t=e.target;this.edition=t.value}}"
					>
						<option value="Base" selected>Base</option>
						<option value="Foil">Foil</option>
						<option value="Holographic">Holographic</option>
						<option value="Polychrome">Polychrome</option>
					</select>
				</label>

				<label class="control-box --flat --grow">
					<span class="label truncate">Enhancement</span>

					<select
						class="pc-enhancement-input select"
						id="card-enhancement-${this.uniqueId}"
						name="card-enhancement-${this.uniqueId}"
						.value="${this.enhancement}"
						@change="${e=>{let t=e.target;this.enhancement=t.value}}"
					>
						<option value="None" selected>None</option>
						<option value="Bonus">Bonus</option>
						<option value="Mult">Mult</option>
						<option value="Wild">Wild</option>
						<option value="Glass">Glass</option>
						<option value="Steel">Steel</option>
						<option value="Stone">Stone</option>
						<option value="Gold">Gold</option>
						<option value="Lucky">Lucky</option>
					</select>
				</label>

				<label class="control-box --flat --grow">
					<span class="label truncate">Seal</span>

					<select
						class="pc-seal-input select"
						id="card-seal-${this.uniqueId}"
						name="card-seal-${this.uniqueId}"
						.value="${this.seal}"
						@change="${e=>{let t=e.target;this.seal=t.value}}"
					>
						<button><selectedcontent></selectedcontent></button>
						<option value="None" selected>
							<span aria-hidden="true" class="pc-seal-orb" style="--seal-color: transparent"></span>
							None
						</option>
						<option value="Gold">
							<span aria-hidden="true" class="pc-seal-orb" style="--seal-color: var(--c-seal-gold)"></span>
							Gold
						</option>
						<option value="Red">
							<span aria-hidden="true" class="pc-seal-orb" style="--seal-color: var(--c-seal-red)"></span>
							Red
						</option>
						<option value="Blue">
							<span aria-hidden="true" class="pc-seal-orb" style="--seal-color: var(--c-seal-blue)"></span>
							Blue
						</option>
						<option value="Purple">
							<span aria-hidden="true" class="pc-seal-orb" style="--seal-color: var(--c-seal-purple)"></span>
							Purple
						</option>
					</select>
				</label>
			</div>
		`}#c;toggleBlindEffects(e,t){let n=e===`The Pillar`&&t;this.classList[n?`add`:`remove`](`--is-blind-the-pillar`)}clone(){return new e({rank:this.rank,suit:this.suit,edition:this.edition,enhancement:this.enhancement,seal:this.seal,debuffed:this.debuffed,played:this.played,count:this.count})}};function Wn(e){for(let t of e.composedPath()){if(t===e.currentTarget)break;if(t instanceof HTMLLabelElement||t instanceof HTMLSelectElement||t instanceof HTMLInputElement||t instanceof HTMLButtonElement||t instanceof HTMLAnchorElement&&t.href)return!0}return!1}function Gn(e,t){let n;return(...r)=>{clearTimeout(n),n=window.setTimeout(()=>{e(...r)},t)}}var Y=``,X={first:`-`,second:`_`,third:`*`},Kn=Z(Oe),qn=Z(ke),Jn=Z(Ne),Yn=Z(je),Xn=Z(Pe),Zn=Z(Object.keys(He)),Qn=Z(Fe),$n=Z(Me),er=Z(Ie);function Z(e){return Object.fromEntries(e.map((e,t)=>[e,t]))}function tr(e){let{hands:t,discards:n,money:r,blind:i,deck:a,observatory:o,jokerSlots:s,handLevels:c,jokers:l,cards:u}=e,d=Object.values(o).map(e=>rr(e)),f=Object.values(c).map(e=>ar(e)),p=l.map(e=>sr(e)),m=u.map(e=>lr(e));return[t===0?Y:t,n===0?Y:n,r===0?Y:r,i.name===`Small Blind`?Y:Kn[i.name],i.active?`1`:Y,a===`Red Deck`?Y:qn[a],s===0?Y:s,d.join(X.second),f.join(X.second),p.join(X.second),m.join(X.second)].join(X.first)}function nr(e){try{let[t,n,r,i,a,o,s,c,l,u,d]=e.split(X.first),f=Object.fromEntries(c?c.split(X.second).map((e,t)=>[Ae[t],ir(e)]):[]),p=Object.fromEntries(l?l.split(X.second).map((e,t)=>[Ae[t],or(e)]):[]),m=u?u.split(X.second).map(e=>cr(e)):[],h=d?d.split(X.second).map(e=>ur(e)):[];return We({hands:t===Y?0:Number(t),discards:n===Y?0:Number(n),money:r===Y?0:Number(r),blind:{name:Oe[Number(i||`0`)],active:a===`1`},deck:ke[Number(o||`0`)],observatory:f,jokerSlots:s===Y?0:Number(s),handLevels:p,jokers:m,cards:h})}catch(e){return console.error(`Failed to parse state. Using default state instead.`,e),We({})}}function rr(e){return String(e===0?Y:e)}function ir(e){return e===Y?0:Number(e)}function ar({level:e,plays:t}){return[e===1?Y:e,t===0?Y:t].join(X.third)}function or(e){let[t,n]=e.split(X.third);return{level:t===Y?1:Number(t),plays:n===Y?0:Number(n)}}function sr(e){let{name:t,edition:n,plusChips:r,plusMultiplier:i,timesMultiplier:a,rank:o,suit:s,active:c,count:l}=e;return[Zn[t],n===`Base`?Y:Xn[n],r===0?Y:r,i===0?Y:i,a===1?Y:a,o?Qn[o]:Y,s?er[s]:Y,c?1:Y,l===1?Y:l].join(X.third)}function cr(e){let[t,n,r,i,a,o,s,c,l]=e.split(X.third);return{name:Ue[Number(t||`0`)],edition:Pe[Number(n||`0`)],plusChips:Number(r||`0`),plusMultiplier:Number(i||`0`),timesMultiplier:Number(a||`1`),rank:o===``?void 0:Fe[Number(o)],suit:s===``?void 0:Ie[Number(s)],active:c===`1`,count:Number(l||`1`)}}function lr(e){let{rank:t,suit:n,edition:r,enhancement:i,seal:a,debuffed:o,played:s,count:c}=e;return[Qn[t],er[n],r===`Base`?Y:Jn[r],i===`None`?Y:Yn[i],a===`None`?Y:$n[a],o?1:Y,s?1:Y,c===1?Y:c].join(X.third)}function ur(e){let[t,n,r,i,a,o,s,c]=e.split(X.third);return{rank:Fe[Number(t||`0`)],suit:Ie[Number(n||`0`)],edition:Ne[Number(r||`0`)],enhancement:je[Number(i||`0`)],seal:Me[Number(a||`0`)],debuffed:o===`1`,played:s===`1`,count:Number(c||`1`)}}var dr={get(e){try{return window.localStorage.getItem(e)}catch(t){return console.error(`Failed to read “${e}” from storage.`,t),null}},set(e,t){try{window.localStorage.setItem(e,t)}catch(t){console.error(`Failed to store “${e}”.`,t)}},remove(e){try{window.localStorage.removeItem(e)}catch(t){console.error(`Failed to remove “${e}” from storage.`,t)}}};function fr(){let e=new URLSearchParams(window.location.search).get(`state`);return e?nr(e):null}function pr(e){let t=new URLSearchParams(window.location.search),n=tr(e);t.set(`state`,n),window.history.pushState({},``,`?${t.toString()}`)}var mr=`Current hand`,hr=class{#e=[];get saves(){return this.#e}getSave(e){return this.#e.find(t=>t.name===e)}#t(e){return this.#e.findIndex(t=>t.name===e)}getAutoSave(){return this.#e.find(e=>e.autoSave)}#n(){return this.#e.findIndex(e=>e.autoSave)}save(e,t,n,r){let i=this.#t(e),a=i===-1?this.#e.length:i,o=this.#e.at(a);this.#e[a]={name:e,time:Date.now(),state:t,hand:n,results:r,autoSave:o?.autoSave??!1}}autoSave(e,t,n){let r=this.#n(),i=r===-1?this.#e.length:r,a=this.#e.at(i);this.#e[i]={name:a?.name??mr,time:Date.now(),state:e,hand:t,results:n,autoSave:!0}}deleteSave(e){this.#e.splice(this.#t(e),1)}retrieveStoredSaves(){try{let e=JSON.parse(dr.get(`saves`)??`[]`);this.#e=e.map(e=>({...e,state:nr(e.state)})).toSorted((e,t)=>t.time-e.time)}catch(e){console.error(`Failed to parse saves.`,e)}}storeSaves(){let e=this.#e.toSorted((e,t)=>t.time-e.time).map(e=>({...e,state:tr(e.state)}));dr.set(`saves`,JSON.stringify(e))}},gr=new Intl.DateTimeFormat(document.documentElement.lang,{year:`numeric`,month:`short`,day:`numeric`,hour:`numeric`,hour12:!1,minute:`numeric`,second:`numeric`}),Q=new hr,$=document.querySelector(`[data-form]`);$?.addEventListener(`submit`,e=>{e.preventDefault(),Wr(Kr())}),$?.addEventListener(`change`,()=>Ir());var _r=document.querySelector(`[aria-live="polite"]`);function vr(e){_r&&(_r.innerText=e)}var yr=Gn(vr,1e3),br=$?.querySelector(`[name="hands"]`),xr=$?.querySelector(`[name="discards"]`),Sr=$?.querySelector(`[name="money"]`),Cr=$?.querySelector(`[name="blindName"]`),wr=$?.querySelector(`[name="blindIsActive"]`),Tr=$?.querySelector(`[name="deck"]`),Er=$?.querySelectorAll(`[data-r-observatory-hand]`)??[],Dr=$?.querySelector(`[name="jokerSlots"]`),Or=$?.querySelector(`[data-h-container]`),kr=$?.querySelector(`[data-j-container]`);($?.querySelector(`[data-j-add-button]`))?.addEventListener(`click`,()=>Jr()),(document.querySelector(`[data-j-duplicate-button]`))?.addEventListener(`click`,e=>Xr(e));var Ar=$?.querySelector(`[data-c-container]`);($?.querySelector(`[data-c-add-button]`))?.addEventListener(`click`,()=>Yr()),(document.querySelector(`[data-c-duplicate-button]`))?.addEventListener(`click`,e=>Xr(e));var jr=$?.querySelector(`[data-sc-container]`),Mr=$?.querySelector(`[data-sc-played-hand]`);($?.querySelector(`[data-sc-reset-button]`))?.addEventListener(`click`,()=>{qr(We({}))});var Nr=document.querySelector(`template#save-row`);(document.querySelector(`[data-s-form]`))?.addEventListener(`submit`,e=>zr(e)),(document.querySelector(`[data-s-import-form]`))?.addEventListener(`submit`,e=>Ur(e));for(let e of document.querySelectorAll(`dialog`))for(let t of e.querySelectorAll(`button[data-modal-close-button]`))t instanceof HTMLButtonElement&&t.addEventListener(`click`,()=>{e.removeAttribute(`data-duplicate-target-id`),e.close()});var Pr=new MutationObserver(e=>{e.some(({type:e})=>e===`childList`)&&Ir()});kr&&Pr.observe(kr,{childList:!0}),Ar&&Pr.observe(Ar,{childList:!0});function Fr(){$||($=document.querySelector(`[data-form]`),br=$?.querySelector(`[name="hands"]`),xr=$?.querySelector(`[name="discards"]`),Sr=$?.querySelector(`[name="money"]`),Cr=$?.querySelector(`[name="blindName"]`),wr=$?.querySelector(`[name="blindIsActive"]`),Tr=$?.querySelector(`[name="deck"]`),Er=$?.querySelectorAll(`[data-r-observatory-hand]`)??[],Dr=$?.querySelector(`[name="jokerSlots"]`),Or=$?.querySelector(`[data-h-container]`),kr=$?.querySelector(`[data-j-container]`),Ar=$?.querySelector(`[data-c-container]`),jr=$?.querySelector(`[data-sc-container]`),Mr=$?.querySelector(`[data-sc-played-hand]`),Nr=document.querySelector(`template#save-row`));if(!$||!br||!xr||!Sr||!Cr||!wr||!Tr||!Dr||!Or||!kr||!Ar||!jr||!Mr||!Nr){window.setTimeout(Fr,50);return}Q.retrieveStoredSaves(),qr(fr()??Q.getAutoSave()?.state??We({})),Lr()}function Ir(){if($.requestSubmit(),$.checkValidity())for(let e of Ar.children)e instanceof Un&&e.toggleBlindEffects(Cr.value,wr.checked)}function Lr(){Q.retrieveStoredSaves();let e=document.querySelector(`[data-s-saves]`);e.innerHTML=``;for(let t of Q.saves){let n=Nr.content.cloneNode(!0),r=n.querySelector(`[data-s-name]`);r.innerHTML=`<b>${t.name}</b>${t.autoSave?` <i>(autosave)</>`:``}`;let i=n.querySelector(`[data-s-hand]`);i.innerHTML=t.hand;let a=n.querySelector(`[data-s-score]`);a.innerHTML=t.results.find(({luck:e})=>e===`average`).formattedScore;let o=n.querySelector(`[data-s-time]`);o.innerText=gr.format(new Date(t.time));let s=n.querySelector(`[data-s-load-button]`);s.setAttribute(`data-save-name`,t.name),s.addEventListener(`click`,e=>Rr(e));let c=n.querySelector(`[data-s-delete-button]`);c.setAttribute(`data-save-name`,t.name),c.addEventListener(`click`,e=>Br(e));let l=n.querySelector(`[data-s-export-button]`);l.setAttribute(`data-save-name`,t.name),l.addEventListener(`click`,e=>Vr(e)),e.appendChild(n)}}function Rr(e){let t=e.currentTarget.getAttribute(`data-save-name`),{state:n}=Q.getSave(t);qr(n)}function zr(e){e.preventDefault();let t=Kr(),n=e.currentTarget,r=new FormData(n).get(`name`)??`Save ${Q.saves.length-1}`,{hand:i,results:a}=Tn(t);Q.save(r,t,i,a),Hr()}function Br(e){let t=e.currentTarget.getAttribute(`data-save-name`);Q.deleteSave(t),Hr()}function Vr(e){let t=e.currentTarget.getAttribute(`data-save-name`),n=Q.getSave(t),r=new Blob([JSON.stringify(n.state)],{type:`application/json`}),i=window.URL.createObjectURL(r),a=Object.assign(document.createElement(`a`),{download:`${n.name}.json`,href:i});a.click(),a.remove(),window.URL.revokeObjectURL(i)}function Hr(){Q.storeSaves(),Lr()}function Ur(e){e.preventDefault();let t=e.currentTarget,n=new FormData(t).get(`import`),r=new FileReader;r.addEventListener(`load`,()=>{if(typeof r.result==`string`){let e=n.name.replace(`.json`,``),t=JSON.parse(r.result),{hand:i,results:a}=Tn(t);Q.save(e,t,i,a),Hr()}}),r.readAsText(n)}function Wr(e){let{hand:t,results:n}=Tn(e);Gr(t,n),pr(e),Q.autoSave(e,t,n),Hr()}function Gr(e,t){let n=new Map;for(let e of t)n.has(e.score)||n.set(e.score,e);Mr.textContent=e,jr.innerHTML=``;for(let e of n.values()){let t=document.querySelector(`template#score-card`).content.cloneNode(!0),n=t.querySelector(`[data-sc-luck]`);n.textContent=e.luck;let r=t.querySelector(`[data-sc-formatted-score]`);r.textContent=e.formattedScore;let i=t.querySelector(`[data-sc-score]`);i.textContent=e.score.includes(`.`)?e.score:e.score.split(``).toReversed().map((e,t)=>e+(t>0&&t%3==0?`,`:``)).toReversed().join(``),jr.appendChild(t)}let r=Array.from(n.values()),i;if(r.length===3){let t=r.at(0).formattedScore;i=`${e} scoring ${r.at(1).formattedScore} on average, ${r.at(2).formattedScore} in the best case, and ${t} in the worst case.`}else i=`${e} scoring ${r.at(0).formattedScore}.`;yr(i);let a=$.querySelector(`[data-sc-log]`);a.innerHTML=r.map(e=>e.log.join(`
`)).join(`
`)}function Kr(){let e=new FormData($),t=Number(e.get(`hands`)),n=Number(e.get(`discards`)),r=Number(e.get(`money`)),i=e.get(`blindName`),a=e.get(`blindIsActive`)===`is-active`,o=e.get(`deck`),s=Number(e.get(`jokerSlots`)),c={hands:t,discards:n,money:r,blind:{name:i,active:a},deck:o,observatory:{},handLevels:{},jokers:[],jokerSlots:s,cards:[]};for(let e of Er){let t=e.getAttribute(`data-r-observatory-hand`);c.observatory[t]=Number(e.value)}for(let e of Or.children)e instanceof Mn&&(c.handLevels[e.handName]={level:e.level,plays:e.plays});for(let e of kr.children)e instanceof Vn&&c.jokers.push({name:e.jokerName,edition:e.edition,plusChips:e.plusChips,plusMultiplier:e.plusMultiplier,timesMultiplier:e.timesMultiplier,rank:e.rank,suit:e.suit,active:e.active,count:e.count});for(let e of Ar.children)e instanceof Un&&c.cards.push({rank:e.rank,suit:e.suit,edition:e.edition,enhancement:e.enhancement,seal:e.seal,debuffed:e.debuffed,played:e.played,count:e.count});return We(c)}function qr(e){br.value=String(e.hands),xr.value=String(e.discards),Sr.value=String(e.money),Cr.value=e.blind.name,wr.checked=e.blind.active,Tr.value=e.deck,Dr.value=String(e.jokerSlots);for(let t of Er){let n=t.getAttribute(`data-r-observatory-hand`);t.value=String(e.observatory[n]??0)}Or.innerHTML=``;for(let[t,n]of Object.entries(e.handLevels))Or.append(new Mn(t,n));kr.innerHTML=``;for(let t of e.jokers)Jr(t);Ar.innerHTML=``;for(let t of e.cards)Yr(t);Wr(e)}function Jr(e){let t=new Vn(e);kr.append(t)}function Yr(e){let t=new Un(e);Ar.append(t),t.toggleBlindEffects(Cr.value,wr.checked)}function Xr(e){let t=e.currentTarget.closest(`dialog`),n=t.getAttribute(`data-duplicate-target-id`)??``,r=document.getElementById(n);if(r instanceof Vn||r instanceof Un){let e=t.querySelector(`input`),n=Number(e.value);for(;n--;){let e=r.clone();r.insertAdjacentElement(`afterend`,e),e instanceof Un&&e.toggleBlindEffects(Cr.value,wr.checked)}}t.close(),Ir()}Fr();