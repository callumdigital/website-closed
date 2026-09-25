var e = {
	svg: "http://www.w3.org/2000/svg",
	xhtml: "http://www.w3.org/1999/xhtml",
	xlink: "http://www.w3.org/1999/xlink",
	xml: "http://www.w3.org/XML/1998/namespace",
	xmlns: "http://www.w3.org/2000/xmlns/"
};
//#endregion
//#region node_modules/d3-selection/src/namespace.js
function t(t) {
	var n = t += "", r = n.indexOf(":");
	return r >= 0 && (n = t.slice(0, r)) !== "xmlns" && (t = t.slice(r + 1)), e.hasOwnProperty(n) ? {
		space: e[n],
		local: t
	} : t;
}
//#endregion
//#region node_modules/d3-selection/src/creator.js
function n(e) {
	return function() {
		var t = this.ownerDocument, n = this.namespaceURI;
		return n === "http://www.w3.org/1999/xhtml" && t.documentElement.namespaceURI === "http://www.w3.org/1999/xhtml" ? t.createElement(e) : t.createElementNS(n, e);
	};
}
function r(e) {
	return function() {
		return this.ownerDocument.createElementNS(e.space, e.local);
	};
}
function i(e) {
	var i = t(e);
	return (i.local ? r : n)(i);
}
//#endregion
//#region node_modules/d3-selection/src/selector.js
function a() {}
function o(e) {
	return e == null ? a : function() {
		return this.querySelector(e);
	};
}
//#endregion
//#region node_modules/d3-selection/src/selection/select.js
function s(e) {
	typeof e != "function" && (e = o(e));
	for (var t = this._groups, n = t.length, r = Array(n), i = 0; i < n; ++i) for (var a = t[i], s = a.length, c = r[i] = Array(s), l, u, d = 0; d < s; ++d) (l = a[d]) && (u = e.call(l, l.__data__, d, a)) && ("__data__" in l && (u.__data__ = l.__data__), c[d] = u);
	return new j(r, this._parents);
}
//#endregion
//#region node_modules/d3-selection/src/array.js
function c(e) {
	return e == null ? [] : Array.isArray(e) ? e : Array.from(e);
}
//#endregion
//#region node_modules/d3-selection/src/selectorAll.js
function l() {
	return [];
}
function u(e) {
	return e == null ? l : function() {
		return this.querySelectorAll(e);
	};
}
//#endregion
//#region node_modules/d3-selection/src/selection/selectAll.js
function d(e) {
	return function() {
		return c(e.apply(this, arguments));
	};
}
function f(e) {
	e = typeof e == "function" ? d(e) : u(e);
	for (var t = this._groups, n = t.length, r = [], i = [], a = 0; a < n; ++a) for (var o = t[a], s = o.length, c, l = 0; l < s; ++l) (c = o[l]) && (r.push(e.call(c, c.__data__, l, o)), i.push(c));
	return new j(r, i);
}
//#endregion
//#region node_modules/d3-selection/src/matcher.js
function p(e) {
	return function() {
		return this.matches(e);
	};
}
function m(e) {
	return function(t) {
		return t.matches(e);
	};
}
//#endregion
//#region node_modules/d3-selection/src/selection/selectChild.js
var h = Array.prototype.find;
function g(e) {
	return function() {
		return h.call(this.children, e);
	};
}
function _() {
	return this.firstElementChild;
}
function v(e) {
	return this.select(e == null ? _ : g(typeof e == "function" ? e : m(e)));
}
//#endregion
//#region node_modules/d3-selection/src/selection/selectChildren.js
var y = Array.prototype.filter;
function b() {
	return Array.from(this.children);
}
function x(e) {
	return function() {
		return y.call(this.children, e);
	};
}
function S(e) {
	return this.selectAll(e == null ? b : x(typeof e == "function" ? e : m(e)));
}
//#endregion
//#region node_modules/d3-selection/src/selection/filter.js
function C(e) {
	typeof e != "function" && (e = p(e));
	for (var t = this._groups, n = t.length, r = Array(n), i = 0; i < n; ++i) for (var a = t[i], o = a.length, s = r[i] = [], c, l = 0; l < o; ++l) (c = a[l]) && e.call(c, c.__data__, l, a) && s.push(c);
	return new j(r, this._parents);
}
//#endregion
//#region node_modules/d3-selection/src/selection/sparse.js
function w(e) {
	return Array(e.length);
}
//#endregion
//#region node_modules/d3-selection/src/selection/enter.js
function T() {
	return new j(this._enter || this._groups.map(w), this._parents);
}
function E(e, t) {
	this.ownerDocument = e.ownerDocument, this.namespaceURI = e.namespaceURI, this._next = null, this._parent = e, this.__data__ = t;
}
E.prototype = {
	constructor: E,
	appendChild: function(e) {
		return this._parent.insertBefore(e, this._next);
	},
	insertBefore: function(e, t) {
		return this._parent.insertBefore(e, t);
	},
	querySelector: function(e) {
		return this._parent.querySelector(e);
	},
	querySelectorAll: function(e) {
		return this._parent.querySelectorAll(e);
	}
};
//#endregion
//#region node_modules/d3-selection/src/constant.js
function D(e) {
	return function() {
		return e;
	};
}
//#endregion
//#region node_modules/d3-selection/src/selection/data.js
function O(e, t, n, r, i, a) {
	for (var o = 0, s, c = t.length, l = a.length; o < l; ++o) (s = t[o]) ? (s.__data__ = a[o], r[o] = s) : n[o] = new E(e, a[o]);
	for (; o < c; ++o) (s = t[o]) && (i[o] = s);
}
function k(e, t, n, r, i, a, o) {
	var s, c, l = /* @__PURE__ */ new Map(), u = t.length, d = a.length, f = Array(u), p;
	for (s = 0; s < u; ++s) (c = t[s]) && (f[s] = p = o.call(c, c.__data__, s, t) + "", l.has(p) ? i[s] = c : l.set(p, c));
	for (s = 0; s < d; ++s) p = o.call(e, a[s], s, a) + "", (c = l.get(p)) ? (r[s] = c, c.__data__ = a[s], l.delete(p)) : n[s] = new E(e, a[s]);
	for (s = 0; s < u; ++s) (c = t[s]) && l.get(f[s]) === c && (i[s] = c);
}
function A(e) {
	return e.__data__;
}
function ee(e, t) {
	if (!arguments.length) return Array.from(this, A);
	var n = t ? k : O, r = this._parents, i = this._groups;
	typeof e != "function" && (e = D(e));
	for (var a = i.length, o = Array(a), s = Array(a), c = Array(a), l = 0; l < a; ++l) {
		var u = r[l], d = i[l], f = d.length, p = te(e.call(u, u && u.__data__, l, r)), m = p.length, h = s[l] = Array(m), g = o[l] = Array(m);
		n(u, d, h, g, c[l] = Array(f), p, t);
		for (var _ = 0, v = 0, y, b; _ < m; ++_) if (y = h[_]) {
			for (_ >= v && (v = _ + 1); !(b = g[v]) && ++v < m;);
			y._next = b || null;
		}
	}
	return o = new j(o, r), o._enter = s, o._exit = c, o;
}
function te(e) {
	return typeof e == "object" && "length" in e ? e : Array.from(e);
}
//#endregion
//#region node_modules/d3-selection/src/selection/exit.js
function ne() {
	return new j(this._exit || this._groups.map(w), this._parents);
}
//#endregion
//#region node_modules/d3-selection/src/selection/join.js
function re(e, t, n) {
	var r = this.enter(), i = this, a = this.exit();
	return typeof e == "function" ? (r = e(r), r &&= r.selection()) : r = r.append(e + ""), t != null && (i = t(i), i &&= i.selection()), n == null ? a.remove() : n(a), r && i ? r.merge(i).order() : i;
}
//#endregion
//#region node_modules/d3-selection/src/selection/merge.js
function ie(e) {
	for (var t = e.selection ? e.selection() : e, n = this._groups, r = t._groups, i = n.length, a = r.length, o = Math.min(i, a), s = Array(i), c = 0; c < o; ++c) for (var l = n[c], u = r[c], d = l.length, f = s[c] = Array(d), p, m = 0; m < d; ++m) (p = l[m] || u[m]) && (f[m] = p);
	for (; c < i; ++c) s[c] = n[c];
	return new j(s, this._parents);
}
//#endregion
//#region node_modules/d3-selection/src/selection/order.js
function ae() {
	for (var e = this._groups, t = -1, n = e.length; ++t < n;) for (var r = e[t], i = r.length - 1, a = r[i], o; --i >= 0;) (o = r[i]) && (a && o.compareDocumentPosition(a) ^ 4 && a.parentNode.insertBefore(o, a), a = o);
	return this;
}
//#endregion
//#region node_modules/d3-selection/src/selection/sort.js
function oe(e) {
	e ||= se;
	function t(t, n) {
		return t && n ? e(t.__data__, n.__data__) : !t - !n;
	}
	for (var n = this._groups, r = n.length, i = Array(r), a = 0; a < r; ++a) {
		for (var o = n[a], s = o.length, c = i[a] = Array(s), l, u = 0; u < s; ++u) (l = o[u]) && (c[u] = l);
		c.sort(t);
	}
	return new j(i, this._parents).order();
}
function se(e, t) {
	return e < t ? -1 : e > t ? 1 : e >= t ? 0 : NaN;
}
//#endregion
//#region node_modules/d3-selection/src/selection/call.js
function ce() {
	var e = arguments[0];
	return arguments[0] = this, e.apply(null, arguments), this;
}
//#endregion
//#region node_modules/d3-selection/src/selection/nodes.js
function le() {
	return Array.from(this);
}
//#endregion
//#region node_modules/d3-selection/src/selection/node.js
function ue() {
	for (var e = this._groups, t = 0, n = e.length; t < n; ++t) for (var r = e[t], i = 0, a = r.length; i < a; ++i) {
		var o = r[i];
		if (o) return o;
	}
	return null;
}
//#endregion
//#region node_modules/d3-selection/src/selection/size.js
function de() {
	let e = 0;
	for (let t of this) ++e;
	return e;
}
//#endregion
//#region node_modules/d3-selection/src/selection/empty.js
function fe() {
	return !this.node();
}
//#endregion
//#region node_modules/d3-selection/src/selection/each.js
function pe(e) {
	for (var t = this._groups, n = 0, r = t.length; n < r; ++n) for (var i = t[n], a = 0, o = i.length, s; a < o; ++a) (s = i[a]) && e.call(s, s.__data__, a, i);
	return this;
}
//#endregion
//#region node_modules/d3-selection/src/selection/attr.js
function me(e) {
	return function() {
		this.removeAttribute(e);
	};
}
function he(e) {
	return function() {
		this.removeAttributeNS(e.space, e.local);
	};
}
function ge(e, t) {
	return function() {
		this.setAttribute(e, t);
	};
}
function _e(e, t) {
	return function() {
		this.setAttributeNS(e.space, e.local, t);
	};
}
function ve(e, t) {
	return function() {
		var n = t.apply(this, arguments);
		n == null ? this.removeAttribute(e) : this.setAttribute(e, n);
	};
}
function ye(e, t) {
	return function() {
		var n = t.apply(this, arguments);
		n == null ? this.removeAttributeNS(e.space, e.local) : this.setAttributeNS(e.space, e.local, n);
	};
}
function be(e, n) {
	var r = t(e);
	if (arguments.length < 2) {
		var i = this.node();
		return r.local ? i.getAttributeNS(r.space, r.local) : i.getAttribute(r);
	}
	return this.each((n == null ? r.local ? he : me : typeof n == "function" ? r.local ? ye : ve : r.local ? _e : ge)(r, n));
}
//#endregion
//#region node_modules/d3-selection/src/window.js
function xe(e) {
	return e.ownerDocument && e.ownerDocument.defaultView || e.document && e || e.defaultView;
}
//#endregion
//#region node_modules/d3-selection/src/selection/style.js
function Se(e) {
	return function() {
		this.style.removeProperty(e);
	};
}
function Ce(e, t, n) {
	return function() {
		this.style.setProperty(e, t, n);
	};
}
function we(e, t, n) {
	return function() {
		var r = t.apply(this, arguments);
		r == null ? this.style.removeProperty(e) : this.style.setProperty(e, r, n);
	};
}
function Te(e, t, n) {
	return arguments.length > 1 ? this.each((t == null ? Se : typeof t == "function" ? we : Ce)(e, t, n ?? "")) : Ee(this.node(), e);
}
function Ee(e, t) {
	return e.style.getPropertyValue(t) || xe(e).getComputedStyle(e, null).getPropertyValue(t);
}
//#endregion
//#region node_modules/d3-selection/src/selection/property.js
function De(e) {
	return function() {
		delete this[e];
	};
}
function Oe(e, t) {
	return function() {
		this[e] = t;
	};
}
function ke(e, t) {
	return function() {
		var n = t.apply(this, arguments);
		n == null ? delete this[e] : this[e] = n;
	};
}
function Ae(e, t) {
	return arguments.length > 1 ? this.each((t == null ? De : typeof t == "function" ? ke : Oe)(e, t)) : this.node()[e];
}
//#endregion
//#region node_modules/d3-selection/src/selection/classed.js
function je(e) {
	return e.trim().split(/^|\s+/);
}
function Me(e) {
	return e.classList || new Ne(e);
}
function Ne(e) {
	this._node = e, this._names = je(e.getAttribute("class") || "");
}
Ne.prototype = {
	add: function(e) {
		this._names.indexOf(e) < 0 && (this._names.push(e), this._node.setAttribute("class", this._names.join(" ")));
	},
	remove: function(e) {
		var t = this._names.indexOf(e);
		t >= 0 && (this._names.splice(t, 1), this._node.setAttribute("class", this._names.join(" ")));
	},
	contains: function(e) {
		return this._names.indexOf(e) >= 0;
	}
};
function Pe(e, t) {
	for (var n = Me(e), r = -1, i = t.length; ++r < i;) n.add(t[r]);
}
function Fe(e, t) {
	for (var n = Me(e), r = -1, i = t.length; ++r < i;) n.remove(t[r]);
}
function Ie(e) {
	return function() {
		Pe(this, e);
	};
}
function Le(e) {
	return function() {
		Fe(this, e);
	};
}
function Re(e, t) {
	return function() {
		(t.apply(this, arguments) ? Pe : Fe)(this, e);
	};
}
function ze(e, t) {
	var n = je(e + "");
	if (arguments.length < 2) {
		for (var r = Me(this.node()), i = -1, a = n.length; ++i < a;) if (!r.contains(n[i])) return !1;
		return !0;
	}
	return this.each((typeof t == "function" ? Re : t ? Ie : Le)(n, t));
}
//#endregion
//#region node_modules/d3-selection/src/selection/text.js
function Be() {
	this.textContent = "";
}
function Ve(e) {
	return function() {
		this.textContent = e;
	};
}
function He(e) {
	return function() {
		var t = e.apply(this, arguments);
		this.textContent = t ?? "";
	};
}
function Ue(e) {
	return arguments.length ? this.each(e == null ? Be : (typeof e == "function" ? He : Ve)(e)) : this.node().textContent;
}
//#endregion
//#region node_modules/d3-selection/src/selection/html.js
function We() {
	this.innerHTML = "";
}
function Ge(e) {
	return function() {
		this.innerHTML = e;
	};
}
function Ke(e) {
	return function() {
		var t = e.apply(this, arguments);
		this.innerHTML = t ?? "";
	};
}
function qe(e) {
	return arguments.length ? this.each(e == null ? We : (typeof e == "function" ? Ke : Ge)(e)) : this.node().innerHTML;
}
//#endregion
//#region node_modules/d3-selection/src/selection/raise.js
function Je() {
	this.nextSibling && this.parentNode.appendChild(this);
}
function Ye() {
	return this.each(Je);
}
//#endregion
//#region node_modules/d3-selection/src/selection/lower.js
function Xe() {
	this.previousSibling && this.parentNode.insertBefore(this, this.parentNode.firstChild);
}
function Ze() {
	return this.each(Xe);
}
//#endregion
//#region node_modules/d3-selection/src/selection/append.js
function Qe(e) {
	var t = typeof e == "function" ? e : i(e);
	return this.select(function() {
		return this.appendChild(t.apply(this, arguments));
	});
}
//#endregion
//#region node_modules/d3-selection/src/selection/insert.js
function $e() {
	return null;
}
function et(e, t) {
	var n = typeof e == "function" ? e : i(e), r = t == null ? $e : typeof t == "function" ? t : o(t);
	return this.select(function() {
		return this.insertBefore(n.apply(this, arguments), r.apply(this, arguments) || null);
	});
}
//#endregion
//#region node_modules/d3-selection/src/selection/remove.js
function tt() {
	var e = this.parentNode;
	e && e.removeChild(this);
}
function nt() {
	return this.each(tt);
}
//#endregion
//#region node_modules/d3-selection/src/selection/clone.js
function rt() {
	var e = this.cloneNode(!1), t = this.parentNode;
	return t ? t.insertBefore(e, this.nextSibling) : e;
}
function it() {
	var e = this.cloneNode(!0), t = this.parentNode;
	return t ? t.insertBefore(e, this.nextSibling) : e;
}
function at(e) {
	return this.select(e ? it : rt);
}
//#endregion
//#region node_modules/d3-selection/src/selection/datum.js
function ot(e) {
	return arguments.length ? this.property("__data__", e) : this.node().__data__;
}
//#endregion
//#region node_modules/d3-selection/src/selection/on.js
function st(e) {
	return function(t) {
		e.call(this, t, this.__data__);
	};
}
function ct(e) {
	return e.trim().split(/^|\s+/).map(function(e) {
		var t = "", n = e.indexOf(".");
		return n >= 0 && (t = e.slice(n + 1), e = e.slice(0, n)), {
			type: e,
			name: t
		};
	});
}
function lt(e) {
	return function() {
		var t = this.__on;
		if (t) {
			for (var n = 0, r = -1, i = t.length, a; n < i; ++n) a = t[n], (!e.type || a.type === e.type) && a.name === e.name ? this.removeEventListener(a.type, a.listener, a.options) : t[++r] = a;
			++r ? t.length = r : delete this.__on;
		}
	};
}
function ut(e, t, n) {
	return function() {
		var r = this.__on, i, a = st(t);
		if (r) {
			for (var o = 0, s = r.length; o < s; ++o) if ((i = r[o]).type === e.type && i.name === e.name) {
				this.removeEventListener(i.type, i.listener, i.options), this.addEventListener(i.type, i.listener = a, i.options = n), i.value = t;
				return;
			}
		}
		this.addEventListener(e.type, a, n), i = {
			type: e.type,
			name: e.name,
			value: t,
			listener: a,
			options: n
		}, r ? r.push(i) : this.__on = [i];
	};
}
function dt(e, t, n) {
	var r = ct(e + ""), i, a = r.length, o;
	if (arguments.length < 2) {
		var s = this.node().__on;
		if (s) {
			for (var c = 0, l = s.length, u; c < l; ++c) for (i = 0, u = s[c]; i < a; ++i) if ((o = r[i]).type === u.type && o.name === u.name) return u.value;
		}
		return;
	}
	for (s = t ? ut : lt, i = 0; i < a; ++i) this.each(s(r[i], t, n));
	return this;
}
//#endregion
//#region node_modules/d3-selection/src/selection/dispatch.js
function ft(e, t, n) {
	var r = xe(e), i = r.CustomEvent;
	typeof i == "function" ? i = new i(t, n) : (i = r.document.createEvent("Event"), n ? (i.initEvent(t, n.bubbles, n.cancelable), i.detail = n.detail) : i.initEvent(t, !1, !1)), e.dispatchEvent(i);
}
function pt(e, t) {
	return function() {
		return ft(this, e, t);
	};
}
function mt(e, t) {
	return function() {
		return ft(this, e, t.apply(this, arguments));
	};
}
function ht(e, t) {
	return this.each((typeof t == "function" ? mt : pt)(e, t));
}
//#endregion
//#region node_modules/d3-selection/src/selection/iterator.js
function* gt() {
	for (var e = this._groups, t = 0, n = e.length; t < n; ++t) for (var r = e[t], i = 0, a = r.length, o; i < a; ++i) (o = r[i]) && (yield o);
}
//#endregion
//#region node_modules/d3-selection/src/selection/index.js
var _t = [null];
function j(e, t) {
	this._groups = e, this._parents = t;
}
function vt() {
	return new j([[document.documentElement]], _t);
}
function yt() {
	return this;
}
j.prototype = vt.prototype = {
	constructor: j,
	select: s,
	selectAll: f,
	selectChild: v,
	selectChildren: S,
	filter: C,
	data: ee,
	enter: T,
	exit: ne,
	join: re,
	merge: ie,
	selection: yt,
	order: ae,
	sort: oe,
	call: ce,
	nodes: le,
	node: ue,
	size: de,
	empty: fe,
	each: pe,
	attr: be,
	style: Te,
	property: Ae,
	classed: ze,
	text: Ue,
	html: qe,
	raise: Ye,
	lower: Ze,
	append: Qe,
	insert: et,
	remove: nt,
	clone: at,
	datum: ot,
	on: dt,
	dispatch: ht,
	[Symbol.iterator]: gt
};
//#endregion
//#region node_modules/d3-selection/src/select.js
function bt(e) {
	return typeof e == "string" ? new j([[document.querySelector(e)]], [document.documentElement]) : new j([[e]], _t);
}
//#endregion
//#region node_modules/d3-array/src/fsum.js
var M = class {
	constructor() {
		this._partials = /* @__PURE__ */ new Float64Array(32), this._n = 0;
	}
	add(e) {
		let t = this._partials, n = 0;
		for (let r = 0; r < this._n && r < 32; r++) {
			let i = t[r], a = e + i, o = Math.abs(e) < Math.abs(i) ? e - (a - i) : i - (a - e);
			o && (t[n++] = o), e = a;
		}
		return t[n] = e, this._n = n + 1, this;
	}
	valueOf() {
		let e = this._partials, t = this._n, n, r, i, a = 0;
		if (t > 0) {
			for (a = e[--t]; t > 0 && (n = a, r = e[--t], a = n + r, i = r - (a - n), !i););
			t > 0 && (i < 0 && e[t - 1] < 0 || i > 0 && e[t - 1] > 0) && (r = i * 2, n = a + r, r == n - a && (a = n));
		}
		return a;
	}
};
//#endregion
//#region node_modules/d3-array/src/merge.js
function* xt(e) {
	for (let t of e) yield* t;
}
function St(e) {
	return Array.from(xt(e));
}
//#endregion
//#region node_modules/d3-array/src/range.js
function N(e, t, n) {
	e = +e, t = +t, n = (i = arguments.length) < 2 ? (t = e, e = 0, 1) : i < 3 ? 1 : +n;
	for (var r = -1, i = Math.max(0, Math.ceil((t - e) / n)) | 0, a = Array(i); ++r < i;) a[r] = e + r * n;
	return a;
}
//#endregion
//#region node_modules/d3-geo/src/math.js
var P = 1e-6, F = Math.PI, I = F / 2, Ct = F / 4, L = F * 2, R = 180 / F, z = F / 180, B = Math.abs, wt = Math.atan, V = Math.atan2, H = Math.cos, Tt = Math.ceil, Et = Math.exp, Dt = Math.log, Ot = Math.pow, U = Math.sin, kt = Math.sign || function(e) {
	return e > 0 ? 1 : e < 0 ? -1 : 0;
}, W = Math.sqrt, At = Math.tan;
function jt(e) {
	return e > 1 ? 0 : e < -1 ? F : Math.acos(e);
}
function Mt(e) {
	return e > 1 ? I : e < -1 ? -I : Math.asin(e);
}
//#endregion
//#region node_modules/d3-geo/src/noop.js
function G() {}
//#endregion
//#region node_modules/d3-geo/src/stream.js
function Nt(e, t) {
	e && Ft.hasOwnProperty(e.type) && Ft[e.type](e, t);
}
var Pt = {
	Feature: function(e, t) {
		Nt(e.geometry, t);
	},
	FeatureCollection: function(e, t) {
		for (var n = e.features, r = -1, i = n.length; ++r < i;) Nt(n[r].geometry, t);
	}
}, Ft = {
	Sphere: function(e, t) {
		t.sphere();
	},
	Point: function(e, t) {
		e = e.coordinates, t.point(e[0], e[1], e[2]);
	},
	MultiPoint: function(e, t) {
		for (var n = e.coordinates, r = -1, i = n.length; ++r < i;) e = n[r], t.point(e[0], e[1], e[2]);
	},
	LineString: function(e, t) {
		It(e.coordinates, t, 0);
	},
	MultiLineString: function(e, t) {
		for (var n = e.coordinates, r = -1, i = n.length; ++r < i;) It(n[r], t, 0);
	},
	Polygon: function(e, t) {
		Lt(e.coordinates, t);
	},
	MultiPolygon: function(e, t) {
		for (var n = e.coordinates, r = -1, i = n.length; ++r < i;) Lt(n[r], t);
	},
	GeometryCollection: function(e, t) {
		for (var n = e.geometries, r = -1, i = n.length; ++r < i;) Nt(n[r], t);
	}
};
function It(e, t, n) {
	var r = -1, i = e.length - n, a;
	for (t.lineStart(); ++r < i;) a = e[r], t.point(a[0], a[1], a[2]);
	t.lineEnd();
}
function Lt(e, t) {
	var n = -1, r = e.length;
	for (t.polygonStart(); ++n < r;) It(e[n], t, 1);
	t.polygonEnd();
}
function K(e, t) {
	e && Pt.hasOwnProperty(e.type) ? Pt[e.type](e, t) : Nt(e, t);
}
//#endregion
//#region node_modules/d3-geo/src/cartesian.js
function Rt(e) {
	return [V(e[1], e[0]), Mt(e[2])];
}
function q(e) {
	var t = e[0], n = e[1], r = H(n);
	return [
		r * H(t),
		r * U(t),
		U(n)
	];
}
function zt(e, t) {
	return e[0] * t[0] + e[1] * t[1] + e[2] * t[2];
}
function Bt(e, t) {
	return [
		e[1] * t[2] - e[2] * t[1],
		e[2] * t[0] - e[0] * t[2],
		e[0] * t[1] - e[1] * t[0]
	];
}
function Vt(e, t) {
	e[0] += t[0], e[1] += t[1], e[2] += t[2];
}
function Ht(e, t) {
	return [
		e[0] * t,
		e[1] * t,
		e[2] * t
	];
}
function Ut(e) {
	var t = W(e[0] * e[0] + e[1] * e[1] + e[2] * e[2]);
	e[0] /= t, e[1] /= t, e[2] /= t;
}
//#endregion
//#region node_modules/d3-geo/src/compose.js
function Wt(e, t) {
	function n(n, r) {
		return n = e(n, r), t(n[0], n[1]);
	}
	return e.invert && t.invert && (n.invert = function(n, r) {
		return n = t.invert(n, r), n && e.invert(n[0], n[1]);
	}), n;
}
//#endregion
//#region node_modules/d3-geo/src/rotation.js
function Gt(e, t) {
	return B(e) > F && (e -= Math.round(e / L) * L), [e, t];
}
Gt.invert = Gt;
function Kt(e, t, n) {
	return (e %= L) ? t || n ? Wt(Jt(e), Yt(t, n)) : Jt(e) : t || n ? Yt(t, n) : Gt;
}
function qt(e) {
	return function(t, n) {
		return t += e, B(t) > F && (t -= Math.round(t / L) * L), [t, n];
	};
}
function Jt(e) {
	var t = qt(e);
	return t.invert = qt(-e), t;
}
function Yt(e, t) {
	var n = H(e), r = U(e), i = H(t), a = U(t);
	function o(e, t) {
		var o = H(t), s = H(e) * o, c = U(e) * o, l = U(t), u = l * n + s * r;
		return [V(c * i - u * a, s * n - l * r), Mt(u * i + c * a)];
	}
	return o.invert = function(e, t) {
		var o = H(t), s = H(e) * o, c = U(e) * o, l = U(t), u = l * i - c * a;
		return [V(c * i + l * a, s * n + u * r), Mt(u * n - s * r)];
	}, o;
}
//#endregion
//#region node_modules/d3-geo/src/circle.js
function Xt(e, t, n, r, i, a) {
	if (n) {
		var o = H(t), s = U(t), c = r * n;
		i == null ? (i = t + r * L, a = t - c / 2) : (i = Zt(o, i), a = Zt(o, a), (r > 0 ? i < a : i > a) && (i += r * L));
		for (var l, u = i; r > 0 ? u > a : u < a; u -= c) l = Rt([
			o,
			-s * H(u),
			-s * U(u)
		]), e.point(l[0], l[1]);
	}
}
function Zt(e, t) {
	t = q(t), t[0] -= e, Ut(t);
	var n = jt(-t[1]);
	return ((-t[2] < 0 ? -n : n) + L - P) % L;
}
//#endregion
//#region node_modules/d3-geo/src/clip/buffer.js
function Qt() {
	var e = [], t;
	return {
		point: function(e, n, r) {
			t.push([
				e,
				n,
				r
			]);
		},
		lineStart: function() {
			e.push(t = []);
		},
		lineEnd: G,
		rejoin: function() {
			e.length > 1 && e.push(e.pop().concat(e.shift()));
		},
		result: function() {
			var n = e;
			return e = [], t = null, n;
		}
	};
}
//#endregion
//#region node_modules/d3-geo/src/pointEqual.js
function $t(e, t) {
	return B(e[0] - t[0]) < 1e-6 && B(e[1] - t[1]) < 1e-6;
}
//#endregion
//#region node_modules/d3-geo/src/clip/rejoin.js
function en(e, t, n, r) {
	this.x = e, this.z = t, this.o = n, this.e = r, this.v = !1, this.n = this.p = null;
}
function tn(e, t, n, r, i) {
	var a = [], o = [], s, c;
	if (e.forEach(function(e) {
		if (!((t = e.length - 1) <= 0)) {
			var t, n = e[0], r = e[t], c;
			if ($t(n, r)) {
				if (!n[2] && !r[2]) {
					for (i.lineStart(), s = 0; s < t; ++s) i.point((n = e[s])[0], n[1]);
					i.lineEnd();
					return;
				}
				r[0] += 2 * P;
			}
			a.push(c = new en(n, e, null, !0)), o.push(c.o = new en(n, null, c, !1)), a.push(c = new en(r, e, null, !1)), o.push(c.o = new en(r, null, c, !0));
		}
	}), a.length) {
		for (o.sort(t), nn(a), nn(o), s = 0, c = o.length; s < c; ++s) o[s].e = n = !n;
		for (var l = a[0], u, d;;) {
			for (var f = l, p = !0; f.v;) if ((f = f.n) === l) return;
			u = f.z, i.lineStart();
			do {
				if (f.v = f.o.v = !0, f.e) {
					if (p) for (s = 0, c = u.length; s < c; ++s) i.point((d = u[s])[0], d[1]);
					else r(f.x, f.n.x, 1, i);
					f = f.n;
				} else {
					if (p) for (u = f.p.z, s = u.length - 1; s >= 0; --s) i.point((d = u[s])[0], d[1]);
					else r(f.x, f.p.x, -1, i);
					f = f.p;
				}
				f = f.o, u = f.z, p = !p;
			} while (!f.v);
			i.lineEnd();
		}
	}
}
function nn(e) {
	if (t = e.length) {
		for (var t, n = 0, r = e[0], i; ++n < t;) r.n = i = e[n], i.p = r, r = i;
		r.n = i = e[0], i.p = r;
	}
}
//#endregion
//#region node_modules/d3-geo/src/polygonContains.js
function rn(e) {
	return B(e[0]) <= F ? e[0] : kt(e[0]) * ((B(e[0]) + F) % L - F);
}
function an(e, t) {
	var n = rn(t), r = t[1], i = U(r), a = [
		U(n),
		-H(n),
		0
	], o = 0, s = 0, c = new M();
	i === 1 ? r = I + P : i === -1 && (r = -I - P);
	for (var l = 0, u = e.length; l < u; ++l) if (f = (d = e[l]).length) for (var d, f, p = d[f - 1], m = rn(p), h = p[1] / 2 + Ct, g = U(h), _ = H(h), v = 0; v < f; ++v, m = b, g = S, _ = C, p = y) {
		var y = d[v], b = rn(y), x = y[1] / 2 + Ct, S = U(x), C = H(x), w = b - m, T = w >= 0 ? 1 : -1, E = T * w, D = E > F, O = g * S;
		if (c.add(V(O * T * U(E), _ * C + O * H(E))), o += D ? w + T * L : w, D ^ m >= n ^ b >= n) {
			var k = Bt(q(p), q(y));
			Ut(k);
			var A = Bt(a, k);
			Ut(A);
			var ee = (D ^ w >= 0 ? -1 : 1) * Mt(A[2]);
			(r > ee || r === ee && (k[0] || k[1])) && (s += D ^ w >= 0 ? 1 : -1);
		}
	}
	return (o < -1e-6 || o < 1e-6 && c < -1e-12) ^ s & 1;
}
//#endregion
//#region node_modules/d3-geo/src/clip/index.js
function on(e, t, n, r) {
	return function(i) {
		var a = t(i), o = Qt(), s = t(o), c = !1, l, u, d, f = {
			point: p,
			lineStart: h,
			lineEnd: g,
			polygonStart: function() {
				f.point = _, f.lineStart = v, f.lineEnd = y, u = [], l = [];
			},
			polygonEnd: function() {
				f.point = p, f.lineStart = h, f.lineEnd = g, u = St(u);
				var e = an(l, r);
				u.length ? (c ||= (i.polygonStart(), !0), tn(u, cn, e, n, i)) : e && (c ||= (i.polygonStart(), !0), i.lineStart(), n(null, null, 1, i), i.lineEnd()), c &&= (i.polygonEnd(), !1), u = l = null;
			},
			sphere: function() {
				i.polygonStart(), i.lineStart(), n(null, null, 1, i), i.lineEnd(), i.polygonEnd();
			}
		};
		function p(t, n) {
			e(t, n) && i.point(t, n);
		}
		function m(e, t) {
			a.point(e, t);
		}
		function h() {
			f.point = m, a.lineStart();
		}
		function g() {
			f.point = p, a.lineEnd();
		}
		function _(e, t) {
			d.push([e, t]), s.point(e, t);
		}
		function v() {
			s.lineStart(), d = [];
		}
		function y() {
			_(d[0][0], d[0][1]), s.lineEnd();
			var e = s.clean(), t = o.result(), n, r = t.length, a, f, p;
			if (d.pop(), l.push(d), d = null, r) {
				if (e & 1) {
					if (f = t[0], (a = f.length - 1) > 0) {
						for (c ||= (i.polygonStart(), !0), i.lineStart(), n = 0; n < a; ++n) i.point((p = f[n])[0], p[1]);
						i.lineEnd();
					}
					return;
				}
				r > 1 && e & 2 && t.push(t.pop().concat(t.shift())), u.push(t.filter(sn));
			}
		}
		return f;
	};
}
function sn(e) {
	return e.length > 1;
}
function cn(e, t) {
	return ((e = e.x)[0] < 0 ? e[1] - I - P : I - e[1]) - ((t = t.x)[0] < 0 ? t[1] - I - P : I - t[1]);
}
//#endregion
//#region node_modules/d3-geo/src/clip/antimeridian.js
var ln = on(function() {
	return !0;
}, un, fn, [-F, -I]);
function un(e) {
	var t = NaN, n = NaN, r = NaN, i;
	return {
		lineStart: function() {
			e.lineStart(), i = 1;
		},
		point: function(a, o) {
			var s = a > 0 ? F : -F, c = B(a - t);
			B(c - F) < 1e-6 ? (e.point(t, n = (n + o) / 2 > 0 ? I : -I), e.point(r, n), e.lineEnd(), e.lineStart(), e.point(s, n), e.point(a, n), i = 0) : r !== s && c >= F && (B(t - r) < 1e-6 && (t -= r * P), B(a - s) < 1e-6 && (a -= s * P), n = dn(t, n, a, o), e.point(r, n), e.lineEnd(), e.lineStart(), e.point(s, n), i = 0), e.point(t = a, n = o), r = s;
		},
		lineEnd: function() {
			e.lineEnd(), t = n = NaN;
		},
		clean: function() {
			return 2 - i;
		}
	};
}
function dn(e, t, n, r) {
	var i, a, o = U(e - n);
	return B(o) > 1e-6 ? wt((U(t) * (a = H(r)) * U(n) - U(r) * (i = H(t)) * U(e)) / (i * a * o)) : (t + r) / 2;
}
function fn(e, t, n, r) {
	var i;
	if (e == null) i = n * I, r.point(-F, i), r.point(0, i), r.point(F, i), r.point(F, 0), r.point(F, -i), r.point(0, -i), r.point(-F, -i), r.point(-F, 0), r.point(-F, i);
	else if (B(e[0] - t[0]) > 1e-6) {
		var a = e[0] < t[0] ? F : -F;
		i = n * a / 2, r.point(-a, i), r.point(0, i), r.point(a, i);
	} else r.point(t[0], t[1]);
}
//#endregion
//#region node_modules/d3-geo/src/clip/circle.js
function pn(e) {
	var t = H(e), n = 2 * z, r = t > 0, i = B(t) > P;
	function a(t, r, i, a) {
		Xt(a, e, n, i, t, r);
	}
	function o(e, n) {
		return H(e) * H(n) > t;
	}
	function s(e) {
		var t, n, a, s, u;
		return {
			lineStart: function() {
				s = a = !1, u = 1;
			},
			point: function(d, f) {
				var p = [d, f], m, h = o(d, f), g = r ? h ? 0 : l(d, f) : h ? l(d + (d < 0 ? F : -F), f) : 0;
				if (!t && (s = a = h) && e.lineStart(), h !== a && (m = c(t, p), (!m || $t(t, m) || $t(p, m)) && (p[2] = 1)), h !== a) u = 0, h ? (e.lineStart(), m = c(p, t), e.point(m[0], m[1])) : (m = c(t, p), e.point(m[0], m[1], 2), e.lineEnd()), t = m;
				else if (i && t && r ^ h) {
					var _;
					!(g & n) && (_ = c(p, t, !0)) && (u = 0, r ? (e.lineStart(), e.point(_[0][0], _[0][1]), e.point(_[1][0], _[1][1]), e.lineEnd()) : (e.point(_[1][0], _[1][1]), e.lineEnd(), e.lineStart(), e.point(_[0][0], _[0][1], 3)));
				}
				h && (!t || !$t(t, p)) && e.point(p[0], p[1]), t = p, a = h, n = g;
			},
			lineEnd: function() {
				a && e.lineEnd(), t = null;
			},
			clean: function() {
				return u | (s && a) << 1;
			}
		};
	}
	function c(e, n, r) {
		var i = q(e), a = q(n), o = [
			1,
			0,
			0
		], s = Bt(i, a), c = zt(s, s), l = s[0], u = c - l * l;
		if (!u) return !r && e;
		var d = t * c / u, f = -t * l / u, p = Bt(o, s), m = Ht(o, d);
		Vt(m, Ht(s, f));
		var h = p, g = zt(m, h), _ = zt(h, h), v = g * g - _ * (zt(m, m) - 1);
		if (!(v < 0)) {
			var y = W(v), b = Ht(h, (-g - y) / _);
			if (Vt(b, m), b = Rt(b), !r) return b;
			var x = e[0], S = n[0], C = e[1], w = n[1], T;
			S < x && (T = x, x = S, S = T);
			var E = S - x, D = B(E - F) < P, O = D || E < 1e-6;
			if (!D && w < C && (T = C, C = w, w = T), O ? D ? C + w > 0 ^ b[1] < (B(b[0] - x) < 1e-6 ? C : w) : C <= b[1] && b[1] <= w : E > F ^ (x <= b[0] && b[0] <= S)) {
				var k = Ht(h, (-g + y) / _);
				return Vt(k, m), [b, Rt(k)];
			}
		}
	}
	function l(t, n) {
		var i = r ? e : F - e, a = 0;
		return t < -i ? a |= 1 : t > i && (a |= 2), n < -i ? a |= 4 : n > i && (a |= 8), a;
	}
	return on(o, s, a, r ? [0, -e] : [-F, e - F]);
}
//#endregion
//#region node_modules/d3-geo/src/clip/line.js
function mn(e, t, n, r, i, a) {
	var o = e[0], s = e[1], c = t[0], l = t[1], u = 0, d = 1, f = c - o, p = l - s, m = n - o;
	if (!(!f && m > 0)) {
		if (m /= f, f < 0) {
			if (m < u) return;
			m < d && (d = m);
		} else if (f > 0) {
			if (m > d) return;
			m > u && (u = m);
		}
		if (m = i - o, !(!f && m < 0)) {
			if (m /= f, f < 0) {
				if (m > d) return;
				m > u && (u = m);
			} else if (f > 0) {
				if (m < u) return;
				m < d && (d = m);
			}
			if (m = r - s, !(!p && m > 0)) {
				if (m /= p, p < 0) {
					if (m < u) return;
					m < d && (d = m);
				} else if (p > 0) {
					if (m > d) return;
					m > u && (u = m);
				}
				if (m = a - s, !(!p && m < 0)) {
					if (m /= p, p < 0) {
						if (m > d) return;
						m > u && (u = m);
					} else if (p > 0) {
						if (m < u) return;
						m < d && (d = m);
					}
					return u > 0 && (e[0] = o + u * f, e[1] = s + u * p), d < 1 && (t[0] = o + d * f, t[1] = s + d * p), !0;
				}
			}
		}
	}
}
//#endregion
//#region node_modules/d3-geo/src/clip/rectangle.js
var hn = 1e9, gn = -hn;
function _n(e, t, n, r) {
	function i(i, a) {
		return e <= i && i <= n && t <= a && a <= r;
	}
	function a(i, a, s, l) {
		var u = 0, d = 0;
		if (i == null || (u = o(i, s)) !== (d = o(a, s)) || c(i, a) < 0 ^ s > 0) do
			l.point(u === 0 || u === 3 ? e : n, u > 1 ? r : t);
		while ((u = (u + s + 4) % 4) !== d);
		else l.point(a[0], a[1]);
	}
	function o(r, i) {
		return B(r[0] - e) < 1e-6 ? i > 0 ? 0 : 3 : B(r[0] - n) < 1e-6 ? i > 0 ? 2 : 1 : B(r[1] - t) < 1e-6 ? +(i > 0) : i > 0 ? 3 : 2;
	}
	function s(e, t) {
		return c(e.x, t.x);
	}
	function c(e, t) {
		var n = o(e, 1), r = o(t, 1);
		return n === r ? n === 0 ? t[1] - e[1] : n === 1 ? e[0] - t[0] : n === 2 ? e[1] - t[1] : t[0] - e[0] : n - r;
	}
	return function(o) {
		var c = o, l = Qt(), u, d, f, p, m, h, g, _, v, y, b, x = {
			point: S,
			lineStart: E,
			lineEnd: D,
			polygonStart: w,
			polygonEnd: T
		};
		function S(e, t) {
			i(e, t) && c.point(e, t);
		}
		function C() {
			for (var t = 0, n = 0, i = d.length; n < i; ++n) for (var a = d[n], o = 1, s = a.length, c = a[0], l, u, f = c[0], p = c[1]; o < s; ++o) l = f, u = p, c = a[o], f = c[0], p = c[1], u <= r ? p > r && (f - l) * (r - u) > (p - u) * (e - l) && ++t : p <= r && (f - l) * (r - u) < (p - u) * (e - l) && --t;
			return t;
		}
		function w() {
			c = l, u = [], d = [], b = !0;
		}
		function T() {
			var e = C(), t = b && e, n = (u = St(u)).length;
			(t || n) && (o.polygonStart(), t && (o.lineStart(), a(null, null, 1, o), o.lineEnd()), n && tn(u, s, e, a, o), o.polygonEnd()), c = o, u = d = f = null;
		}
		function E() {
			x.point = O, d && d.push(f = []), y = !0, v = !1, g = _ = NaN;
		}
		function D() {
			u && (O(p, m), h && v && l.rejoin(), u.push(l.result())), x.point = S, v && c.lineEnd();
		}
		function O(a, o) {
			var s = i(a, o);
			if (d && f.push([a, o]), y) p = a, m = o, h = s, y = !1, s && (c.lineStart(), c.point(a, o));
			else if (s && v) c.point(a, o);
			else {
				var l = [g = Math.max(gn, Math.min(hn, g)), _ = Math.max(gn, Math.min(hn, _))], u = [a = Math.max(gn, Math.min(hn, a)), o = Math.max(gn, Math.min(hn, o))];
				mn(l, u, e, t, n, r) ? (v || (c.lineStart(), c.point(l[0], l[1])), c.point(u[0], u[1]), s || c.lineEnd(), b = !1) : s && (c.lineStart(), c.point(a, o), b = !1);
			}
			g = a, _ = o, v = s;
		}
		return x;
	};
}
//#endregion
//#region node_modules/d3-geo/src/graticule.js
function vn(e, t, n) {
	var r = N(e, t - P, n).concat(t);
	return function(e) {
		return r.map(function(t) {
			return [e, t];
		});
	};
}
function yn(e, t, n) {
	var r = N(e, t - P, n).concat(t);
	return function(e) {
		return r.map(function(t) {
			return [t, e];
		});
	};
}
function bn() {
	var e, t, n, r, i, a, o, s, c = 10, l = c, u = 90, d = 360, f, p, m, h, g = 2.5;
	function _() {
		return {
			type: "MultiLineString",
			coordinates: v()
		};
	}
	function v() {
		return N(Tt(r / u) * u, n, u).map(m).concat(N(Tt(s / d) * d, o, d).map(h)).concat(N(Tt(t / c) * c, e, c).filter(function(e) {
			return B(e % u) > P;
		}).map(f)).concat(N(Tt(a / l) * l, i, l).filter(function(e) {
			return B(e % d) > P;
		}).map(p));
	}
	return _.lines = function() {
		return v().map(function(e) {
			return {
				type: "LineString",
				coordinates: e
			};
		});
	}, _.outline = function() {
		return {
			type: "Polygon",
			coordinates: [m(r).concat(h(o).slice(1), m(n).reverse().slice(1), h(s).reverse().slice(1))]
		};
	}, _.extent = function(e) {
		return arguments.length ? _.extentMajor(e).extentMinor(e) : _.extentMinor();
	}, _.extentMajor = function(e) {
		return arguments.length ? (r = +e[0][0], n = +e[1][0], s = +e[0][1], o = +e[1][1], r > n && (e = r, r = n, n = e), s > o && (e = s, s = o, o = e), _.precision(g)) : [[r, s], [n, o]];
	}, _.extentMinor = function(n) {
		return arguments.length ? (t = +n[0][0], e = +n[1][0], a = +n[0][1], i = +n[1][1], t > e && (n = t, t = e, e = n), a > i && (n = a, a = i, i = n), _.precision(g)) : [[t, a], [e, i]];
	}, _.step = function(e) {
		return arguments.length ? _.stepMajor(e).stepMinor(e) : _.stepMinor();
	}, _.stepMajor = function(e) {
		return arguments.length ? (u = +e[0], d = +e[1], _) : [u, d];
	}, _.stepMinor = function(e) {
		return arguments.length ? (c = +e[0], l = +e[1], _) : [c, l];
	}, _.precision = function(c) {
		return arguments.length ? (g = +c, f = vn(a, i, 90), p = yn(t, e, g), m = vn(s, o, 90), h = yn(r, n, g), _) : g;
	}, _.extentMajor([[-180, -90 + P], [180, 90 - P]]).extentMinor([[-180, -80 - P], [180, 80 + P]]);
}
function xn() {
	return bn()();
}
//#endregion
//#region node_modules/d3-geo/src/identity.js
var Sn = (e) => e, Cn = new M(), wn = new M(), Tn, En, Dn, On, J = {
	point: G,
	lineStart: G,
	lineEnd: G,
	polygonStart: function() {
		J.lineStart = kn, J.lineEnd = Mn;
	},
	polygonEnd: function() {
		J.lineStart = J.lineEnd = J.point = G, Cn.add(B(wn)), wn = new M();
	},
	result: function() {
		var e = Cn / 2;
		return Cn = new M(), e;
	}
};
function kn() {
	J.point = An;
}
function An(e, t) {
	J.point = jn, Tn = Dn = e, En = On = t;
}
function jn(e, t) {
	wn.add(On * e - Dn * t), Dn = e, On = t;
}
function Mn() {
	jn(Tn, En);
}
//#endregion
//#region node_modules/d3-geo/src/path/bounds.js
var Y = Infinity, Nn = Y, Pn = -Y, Fn = Pn, In = {
	point: Ln,
	lineStart: G,
	lineEnd: G,
	polygonStart: G,
	polygonEnd: G,
	result: function() {
		var e = [[Y, Nn], [Pn, Fn]];
		return Pn = Fn = -(Nn = Y = Infinity), e;
	}
};
function Ln(e, t) {
	e < Y && (Y = e), e > Pn && (Pn = e), t < Nn && (Nn = t), t > Fn && (Fn = t);
}
//#endregion
//#region node_modules/d3-geo/src/path/centroid.js
var Rn = 0, zn = 0, Bn = 0, Vn = 0, Hn = 0, Un = 0, Wn = 0, Gn = 0, Kn = 0, qn, Jn, X, Z, Q = {
	point: $,
	lineStart: Yn,
	lineEnd: Qn,
	polygonStart: function() {
		Q.lineStart = $n, Q.lineEnd = er;
	},
	polygonEnd: function() {
		Q.point = $, Q.lineStart = Yn, Q.lineEnd = Qn;
	},
	result: function() {
		var e = Kn ? [Wn / Kn, Gn / Kn] : Un ? [Vn / Un, Hn / Un] : Bn ? [Rn / Bn, zn / Bn] : [NaN, NaN];
		return Rn = zn = Bn = Vn = Hn = Un = Wn = Gn = Kn = 0, e;
	}
};
function $(e, t) {
	Rn += e, zn += t, ++Bn;
}
function Yn() {
	Q.point = Xn;
}
function Xn(e, t) {
	Q.point = Zn, $(X = e, Z = t);
}
function Zn(e, t) {
	var n = e - X, r = t - Z, i = W(n * n + r * r);
	Vn += i * (X + e) / 2, Hn += i * (Z + t) / 2, Un += i, $(X = e, Z = t);
}
function Qn() {
	Q.point = $;
}
function $n() {
	Q.point = tr;
}
function er() {
	nr(qn, Jn);
}
function tr(e, t) {
	Q.point = nr, $(qn = X = e, Jn = Z = t);
}
function nr(e, t) {
	var n = e - X, r = t - Z, i = W(n * n + r * r);
	Vn += i * (X + e) / 2, Hn += i * (Z + t) / 2, Un += i, i = Z * e - X * t, Wn += i * (X + e), Gn += i * (Z + t), Kn += i * 3, $(X = e, Z = t);
}
//#endregion
//#region node_modules/d3-geo/src/path/context.js
function rr(e) {
	this._context = e;
}
rr.prototype = {
	_radius: 4.5,
	pointRadius: function(e) {
		return this._radius = e, this;
	},
	polygonStart: function() {
		this._line = 0;
	},
	polygonEnd: function() {
		this._line = NaN;
	},
	lineStart: function() {
		this._point = 0;
	},
	lineEnd: function() {
		this._line === 0 && this._context.closePath(), this._point = NaN;
	},
	point: function(e, t) {
		switch (this._point) {
			case 0:
				this._context.moveTo(e, t), this._point = 1;
				break;
			case 1:
				this._context.lineTo(e, t);
				break;
			default: this._context.moveTo(e + this._radius, t), this._context.arc(e, t, this._radius, 0, L);
		}
	},
	result: G
};
//#endregion
//#region node_modules/d3-geo/src/path/measure.js
var ir = new M(), ar, or, sr, cr, lr, ur = {
	point: G,
	lineStart: function() {
		ur.point = dr;
	},
	lineEnd: function() {
		ar && fr(or, sr), ur.point = G;
	},
	polygonStart: function() {
		ar = !0;
	},
	polygonEnd: function() {
		ar = null;
	},
	result: function() {
		var e = +ir;
		return ir = new M(), e;
	}
};
function dr(e, t) {
	ur.point = fr, or = cr = e, sr = lr = t;
}
function fr(e, t) {
	cr -= e, lr -= t, ir.add(W(cr * cr + lr * lr)), cr = e, lr = t;
}
//#endregion
//#region node_modules/d3-geo/src/path/string.js
var pr, mr, hr, gr, _r = class {
	constructor(e) {
		this._append = e == null ? vr : yr(e), this._radius = 4.5, this._ = "";
	}
	pointRadius(e) {
		return this._radius = +e, this;
	}
	polygonStart() {
		this._line = 0;
	}
	polygonEnd() {
		this._line = NaN;
	}
	lineStart() {
		this._point = 0;
	}
	lineEnd() {
		this._line === 0 && (this._ += "Z"), this._point = NaN;
	}
	point(e, t) {
		switch (this._point) {
			case 0:
				this._append`M${e},${t}`, this._point = 1;
				break;
			case 1:
				this._append`L${e},${t}`;
				break;
			default:
				if (this._append`M${e},${t}`, this._radius !== hr || this._append !== mr) {
					let e = this._radius, t = this._;
					this._ = "", this._append`m0,${e}a${e},${e} 0 1,1 0,${-2 * e}a${e},${e} 0 1,1 0,${2 * e}z`, hr = e, mr = this._append, gr = this._, this._ = t;
				}
				this._ += gr;
		}
	}
	result() {
		let e = this._;
		return this._ = "", e.length ? e : null;
	}
};
function vr(e) {
	let t = 1;
	this._ += e[0];
	for (let n = e.length; t < n; ++t) this._ += arguments[t] + e[t];
}
function yr(e) {
	let t = Math.floor(e);
	if (!(t >= 0)) throw RangeError(`invalid digits: ${e}`);
	if (t > 15) return vr;
	if (t !== pr) {
		let e = 10 ** t;
		pr = t, mr = function(t) {
			let n = 1;
			this._ += t[0];
			for (let r = t.length; n < r; ++n) this._ += Math.round(arguments[n] * e) / e + t[n];
		};
	}
	return mr;
}
//#endregion
//#region node_modules/d3-geo/src/path/index.js
function br(e, t) {
	let n = 3, r = 4.5, i, a;
	function o(e) {
		return e && (typeof r == "function" && a.pointRadius(+r.apply(this, arguments)), K(e, i(a))), a.result();
	}
	return o.area = function(e) {
		return K(e, i(J)), J.result();
	}, o.measure = function(e) {
		return K(e, i(ur)), ur.result();
	}, o.bounds = function(e) {
		return K(e, i(In)), In.result();
	}, o.centroid = function(e) {
		return K(e, i(Q)), Q.result();
	}, o.projection = function(t) {
		return arguments.length ? (i = t == null ? (e = null, Sn) : (e = t).stream, o) : e;
	}, o.context = function(e) {
		return arguments.length ? (a = e == null ? (t = null, new _r(n)) : new rr(t = e), typeof r != "function" && a.pointRadius(r), o) : t;
	}, o.pointRadius = function(e) {
		return arguments.length ? (r = typeof e == "function" ? e : (a.pointRadius(+e), +e), o) : r;
	}, o.digits = function(e) {
		if (!arguments.length) return n;
		if (e == null) n = null;
		else {
			let t = Math.floor(e);
			if (!(t >= 0)) throw RangeError(`invalid digits: ${e}`);
			n = t;
		}
		return t === null && (a = new _r(n)), o;
	}, o.projection(e).digits(n).context(t);
}
//#endregion
//#region node_modules/d3-geo/src/transform.js
function xr(e) {
	return function(t) {
		var n = new Sr();
		for (var r in e) n[r] = e[r];
		return n.stream = t, n;
	};
}
function Sr() {}
Sr.prototype = {
	constructor: Sr,
	point: function(e, t) {
		this.stream.point(e, t);
	},
	sphere: function() {
		this.stream.sphere();
	},
	lineStart: function() {
		this.stream.lineStart();
	},
	lineEnd: function() {
		this.stream.lineEnd();
	},
	polygonStart: function() {
		this.stream.polygonStart();
	},
	polygonEnd: function() {
		this.stream.polygonEnd();
	}
};
//#endregion
//#region node_modules/d3-geo/src/projection/fit.js
function Cr(e, t, n) {
	var r = e.clipExtent && e.clipExtent();
	return e.scale(150).translate([0, 0]), r != null && e.clipExtent(null), K(n, e.stream(In)), t(In.result()), r != null && e.clipExtent(r), e;
}
function wr(e, t, n) {
	return Cr(e, function(n) {
		var r = t[1][0] - t[0][0], i = t[1][1] - t[0][1], a = Math.min(r / (n[1][0] - n[0][0]), i / (n[1][1] - n[0][1])), o = +t[0][0] + (r - a * (n[1][0] + n[0][0])) / 2, s = +t[0][1] + (i - a * (n[1][1] + n[0][1])) / 2;
		e.scale(150 * a).translate([o, s]);
	}, n);
}
function Tr(e, t, n) {
	return wr(e, [[0, 0], t], n);
}
function Er(e, t, n) {
	return Cr(e, function(n) {
		var r = +t, i = r / (n[1][0] - n[0][0]), a = (r - i * (n[1][0] + n[0][0])) / 2, o = -i * n[0][1];
		e.scale(150 * i).translate([a, o]);
	}, n);
}
function Dr(e, t, n) {
	return Cr(e, function(n) {
		var r = +t, i = r / (n[1][1] - n[0][1]), a = -i * n[0][0], o = (r - i * (n[1][1] + n[0][1])) / 2;
		e.scale(150 * i).translate([a, o]);
	}, n);
}
//#endregion
//#region node_modules/d3-geo/src/projection/resample.js
var Or = 16, kr = H(30 * z);
function Ar(e, t) {
	return +t ? Mr(e, t) : jr(e);
}
function jr(e) {
	return xr({ point: function(t, n) {
		t = e(t, n), this.stream.point(t[0], t[1]);
	} });
}
function Mr(e, t) {
	function n(r, i, a, o, s, c, l, u, d, f, p, m, h, g) {
		var _ = l - r, v = u - i, y = _ * _ + v * v;
		if (y > 4 * t && h--) {
			var b = o + f, x = s + p, S = c + m, C = W(b * b + x * x + S * S), w = Mt(S /= C), T = B(B(S) - 1) < 1e-6 || B(a - d) < 1e-6 ? (a + d) / 2 : V(x, b), E = e(T, w), D = E[0], O = E[1], k = D - r, A = O - i, ee = v * k - _ * A;
			(ee * ee / y > t || B((_ * k + v * A) / y - .5) > .3 || o * f + s * p + c * m < kr) && (n(r, i, a, o, s, c, D, O, T, b /= C, x /= C, S, h, g), g.point(D, O), n(D, O, T, b, x, S, l, u, d, f, p, m, h, g));
		}
	}
	return function(t) {
		var r, i, a, o, s, c, l, u, d, f, p, m, h = {
			point: g,
			lineStart: _,
			lineEnd: y,
			polygonStart: function() {
				t.polygonStart(), h.lineStart = b;
			},
			polygonEnd: function() {
				t.polygonEnd(), h.lineStart = _;
			}
		};
		function g(n, r) {
			n = e(n, r), t.point(n[0], n[1]);
		}
		function _() {
			u = NaN, h.point = v, t.lineStart();
		}
		function v(r, i) {
			var a = q([r, i]), o = e(r, i);
			n(u, d, l, f, p, m, u = o[0], d = o[1], l = r, f = a[0], p = a[1], m = a[2], Or, t), t.point(u, d);
		}
		function y() {
			h.point = g, t.lineEnd();
		}
		function b() {
			_(), h.point = x, h.lineEnd = S;
		}
		function x(e, t) {
			v(r = e, t), i = u, a = d, o = f, s = p, c = m, h.point = v;
		}
		function S() {
			n(u, d, l, f, p, m, i, a, r, o, s, c, Or, t), h.lineEnd = y, y();
		}
		return h;
	};
}
//#endregion
//#region node_modules/d3-geo/src/projection/index.js
var Nr = xr({ point: function(e, t) {
	this.stream.point(e * z, t * z);
} });
function Pr(e) {
	return xr({ point: function(t, n) {
		var r = e(t, n);
		return this.stream.point(r[0], r[1]);
	} });
}
function Fr(e, t, n, r, i) {
	function a(a, o) {
		return a *= r, o *= i, [t + e * a, n - e * o];
	}
	return a.invert = function(a, o) {
		return [(a - t) / e * r, (n - o) / e * i];
	}, a;
}
function Ir(e, t, n, r, i, a) {
	if (!a) return Fr(e, t, n, r, i);
	var o = H(a), s = U(a), c = o * e, l = s * e, u = o / e, d = s / e, f = (s * n - o * t) / e, p = (s * t + o * n) / e;
	function m(e, a) {
		return e *= r, a *= i, [c * e - l * a + t, n - l * e - c * a];
	}
	return m.invert = function(e, t) {
		return [r * (u * e - d * t + f), i * (p - d * e - u * t)];
	}, m;
}
function Lr(e) {
	return Rr(function() {
		return e;
	})();
}
function Rr(e) {
	var t, n = 150, r = 480, i = 250, a = 0, o = 0, s = 0, c = 0, l = 0, u, d = 0, f = 1, p = 1, m = null, h = ln, g = null, _, v, y, b = Sn, x = .5, S, C, w, T, E;
	function D(e) {
		return w(e[0] * z, e[1] * z);
	}
	function O(e) {
		return e = w.invert(e[0], e[1]), e && [e[0] * R, e[1] * R];
	}
	D.stream = function(e) {
		return T && E === e ? T : T = Nr(Pr(u)(h(S(b(E = e)))));
	}, D.preclip = function(e) {
		return arguments.length ? (h = e, m = void 0, A()) : h;
	}, D.postclip = function(e) {
		return arguments.length ? (b = e, g = _ = v = y = null, A()) : b;
	}, D.clipAngle = function(e) {
		return arguments.length ? (h = +e ? pn(m = e * z) : (m = null, ln), A()) : m * R;
	}, D.clipExtent = function(e) {
		return arguments.length ? (b = e == null ? (g = _ = v = y = null, Sn) : _n(g = +e[0][0], _ = +e[0][1], v = +e[1][0], y = +e[1][1]), A()) : g == null ? null : [[g, _], [v, y]];
	}, D.scale = function(e) {
		return arguments.length ? (n = +e, k()) : n;
	}, D.translate = function(e) {
		return arguments.length ? (r = +e[0], i = +e[1], k()) : [r, i];
	}, D.center = function(e) {
		return arguments.length ? (a = e[0] % 360 * z, o = e[1] % 360 * z, k()) : [a * R, o * R];
	}, D.rotate = function(e) {
		return arguments.length ? (s = e[0] % 360 * z, c = e[1] % 360 * z, l = e.length > 2 ? e[2] % 360 * z : 0, k()) : [
			s * R,
			c * R,
			l * R
		];
	}, D.angle = function(e) {
		return arguments.length ? (d = e % 360 * z, k()) : d * R;
	}, D.reflectX = function(e) {
		return arguments.length ? (f = e ? -1 : 1, k()) : f < 0;
	}, D.reflectY = function(e) {
		return arguments.length ? (p = e ? -1 : 1, k()) : p < 0;
	}, D.precision = function(e) {
		return arguments.length ? (S = Ar(C, x = e * e), A()) : W(x);
	}, D.fitExtent = function(e, t) {
		return wr(D, e, t);
	}, D.fitSize = function(e, t) {
		return Tr(D, e, t);
	}, D.fitWidth = function(e, t) {
		return Er(D, e, t);
	}, D.fitHeight = function(e, t) {
		return Dr(D, e, t);
	};
	function k() {
		var e = Ir(n, 0, 0, f, p, d).apply(null, t(a, o)), m = Ir(n, r - e[0], i - e[1], f, p, d);
		return u = Kt(s, c, l), C = Wt(t, m), w = Wt(u, C), S = Ar(C, x), A();
	}
	function A() {
		return T = E = null, D;
	}
	return function() {
		return t = e.apply(this, arguments), D.invert = t.invert && O, k();
	};
}
//#endregion
//#region node_modules/d3-geo/src/projection/conic.js
function zr(e) {
	var t = 0, n = F / 3, r = Rr(e), i = r(t, n);
	return i.parallels = function(e) {
		return arguments.length ? r(t = e[0] * z, n = e[1] * z) : [t * R, n * R];
	}, i;
}
//#endregion
//#region node_modules/d3-geo/src/projection/mercator.js
function Br(e, t) {
	return [e, Dt(At((I + t) / 2))];
}
Br.invert = function(e, t) {
	return [e, 2 * wt(Et(t)) - I];
};
//#endregion
//#region node_modules/d3-geo/src/projection/conicConformal.js
function Vr(e) {
	return At((I + e) / 2);
}
function Hr(e, t) {
	var n = H(e), r = e === t ? U(e) : Dt(n / H(t)) / Dt(Vr(t) / Vr(e)), i = n * Ot(Vr(e), r) / r;
	if (!r) return Br;
	function a(e, t) {
		i > 0 ? t < -I + 1e-6 && (t = -I + P) : t > I - 1e-6 && (t = I - P);
		var n = i / Ot(Vr(t), r);
		return [n * U(r * e), i - n * H(r * e)];
	}
	return a.invert = function(e, t) {
		var n = i - t, a = kt(r) * W(e * e + n * n), o = V(e, B(n)) * kt(n);
		return n * r < 0 && (o -= F * kt(e) * kt(n)), [o / r, 2 * wt(Ot(i / a, 1 / r)) - I];
	}, a;
}
function Ur() {
	return zr(Hr).scale(109.5).parallels([30, 30]);
}
//#endregion
//#region node_modules/d3-geo/src/projection/naturalEarth1.js
function Wr(e, t) {
	var n = t * t, r = n * n;
	return [e * (.8707 - .131979 * n + r * (-.013791 + r * (.003971 * n - .001529 * r))), t * (1.007226 + n * (.015085 + r * (-.044475 + .028874 * n - .005916 * r)))];
}
Wr.invert = function(e, t) {
	var n = t, r = 25, i;
	do {
		var a = n * n, o = a * a;
		n -= i = (n * (1.007226 + a * (.015085 + o * (-.044475 + .028874 * a - .005916 * o))) - t) / (1.007226 + a * (.045255 + o * (-.311325 + .259866 * a - .005916 * 11 * o)));
	} while (B(i) > 1e-6 && --r > 0);
	return [e / (.8707 + (a = n * n) * (-.131979 + a * (-.013791 + a * a * a * (.003971 - .001529 * a)))), n];
};
function Gr() {
	return Lr(Wr).scale(175.295);
}
//#endregion
//#region node_modules/topojson-client/src/identity.js
function Kr(e) {
	return e;
}
//#endregion
//#region node_modules/topojson-client/src/transform.js
function qr(e) {
	if (e == null) return Kr;
	var t, n, r = e.scale[0], i = e.scale[1], a = e.translate[0], o = e.translate[1];
	return function(e, s) {
		s || (t = n = 0);
		var c = 2, l = e.length, u = Array(l);
		for (u[0] = (t += e[0]) * r + a, u[1] = (n += e[1]) * i + o; c < l;) u[c] = e[c], ++c;
		return u;
	};
}
//#endregion
//#region node_modules/topojson-client/src/reverse.js
function Jr(e, t) {
	for (var n, r = e.length, i = r - t; i < --r;) n = e[i], e[i++] = e[r], e[r] = n;
}
//#endregion
//#region node_modules/topojson-client/src/feature.js
function Yr(e, t) {
	return typeof t == "string" && (t = e.objects[t]), t.type === "GeometryCollection" ? {
		type: "FeatureCollection",
		features: t.geometries.map(function(t) {
			return Xr(e, t);
		})
	} : Xr(e, t);
}
function Xr(e, t) {
	var n = t.id, r = t.bbox, i = t.properties == null ? {} : t.properties, a = Zr(e, t);
	return n == null && r == null ? {
		type: "Feature",
		properties: i,
		geometry: a
	} : r == null ? {
		type: "Feature",
		id: n,
		properties: i,
		geometry: a
	} : {
		type: "Feature",
		id: n,
		bbox: r,
		properties: i,
		geometry: a
	};
}
function Zr(e, t) {
	var n = qr(e.transform), r = e.arcs;
	function i(e, t) {
		t.length && t.pop();
		for (var i = r[e < 0 ? ~e : e], a = 0, o = i.length; a < o; ++a) t.push(n(i[a], a));
		e < 0 && Jr(t, o);
	}
	function a(e) {
		return n(e);
	}
	function o(e) {
		for (var t = [], n = 0, r = e.length; n < r; ++n) i(e[n], t);
		return t.length < 2 && t.push(t[0]), t;
	}
	function s(e) {
		for (var t = o(e); t.length < 4;) t.push(t[0]);
		return t;
	}
	function c(e) {
		return e.map(s);
	}
	function l(e) {
		var t = e.type, n;
		switch (t) {
			case "GeometryCollection": return {
				type: t,
				geometries: e.geometries.map(l)
			};
			case "Point":
				n = a(e.coordinates);
				break;
			case "MultiPoint":
				n = e.coordinates.map(a);
				break;
			case "LineString":
				n = o(e.arcs);
				break;
			case "MultiLineString":
				n = e.arcs.map(o);
				break;
			case "Polygon":
				n = c(e.arcs);
				break;
			case "MultiPolygon":
				n = e.arcs.map(c);
				break;
			default: return null;
		}
		return {
			type: t,
			coordinates: n
		};
	}
	return l(t);
}
//#endregion
export { Yr as feature, Ur as geoConicConformal, xn as geoGraticule10, Gr as geoNaturalEarth1, br as geoPath, bt as select };
