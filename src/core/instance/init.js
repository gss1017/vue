/* @flow */

import config from '../config'
import { initProxy } from './proxy'
import { initState } from './state'
import { initRender } from './render'
import { initEvents } from './events'
import { mark, measure } from '../util/perf'
import { initLifecycle, callHook } from './lifecycle'
import { initProvide, initInjections } from './inject'
import { extend, mergeOptions, formatComponentName } from '../util/index'

let uid = 0

export function initMixin (Vue: Class<Component>) {
  Vue.prototype._init = function (options?: Object) {
    // 初始化 组件的实例
    const vm: Component = this
    // a uid
    // vue 组件全局计数，也是对应组件的唯一id
    vm._uid = uid++

    let startTag, endTag
    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
      startTag = `vue-perf-start:${vm._uid}`
      endTag = `vue-perf-end:${vm._uid}`
      mark(startTag)
    }

    // a flag to avoid this being observed
    // 是否是一个vue实例
    vm._isVue = true
    // merge options 合并组件 options
    // options 选项二次处理
    if (options && options._isComponent) {
      // optimize internal component instantiation
      // since dynamic options merging is pretty slow, and none of the
      // internal component options needs special treatment.
      // vm.$options 
      initInternalComponent(vm, options)
    } else {
      // 将 Vue 构建函数上的options 与 传入的options 合并
      // 返回一个新的 options 对象
      vm.$options = mergeOptions(
        resolveConstructorOptions(vm.constructor),
        options || {},
        vm
      )
    }
    /* istanbul ignore else */
    if (process.env.NODE_ENV !== 'production') {
      initProxy(vm)
    } else {
      vm._renderProxy = vm
    }
    // expose real self
    vm._self = vm
    // 初始化生命周期相关属性
    initLifecycle(vm)
    // 初始化事件相关的属性
    initEvents(vm)
    // 初始化组件渲染的必要属性
    initRender(vm)
    // 调用生命周期
    callHook(vm, 'beforeCreate')
    // 给实例上挂载 全局注入的属性
    initInjections(vm) // resolve injections before data/props
    initState(vm)
    initProvide(vm) // resolve provide after data/props
    callHook(vm, 'created')

    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
      vm._name = formatComponentName(vm, false)
      mark(endTag)
      measure(`vue ${vm._name} init`, startTag, endTag)
    }

    if (vm.$options.el) {
      vm.$mount(vm.$options.el)
    }
  }
}

export function initInternalComponent (vm: Component, options: InternalComponentOptions) {
  const opts = vm.$options = Object.create(vm.constructor.options)
  // doing this because it's faster than dynamic enumeration.
  const parentVnode = options._parentVnode
  opts.parent = options.parent
  opts._parentVnode = parentVnode

  const vnodeComponentOptions = parentVnode.componentOptions
  opts.propsData = vnodeComponentOptions.propsData
  opts._parentListeners = vnodeComponentOptions.listeners
  opts._renderChildren = vnodeComponentOptions.children
  opts._componentTag = vnodeComponentOptions.tag

  if (options.render) {
    opts.render = options.render
    opts.staticRenderFns = options.staticRenderFns
  }
}
/**
 * @description 处理构造函数的 options
 * @param {Class<Component>} Ctor -> Vue构造函数
 */
export function resolveConstructorOptions (Ctor: Class<Component>) {
  // 构造函数上的初始配置项
  let options = Ctor.options
  if (Ctor.super) {
    // Vue 构造函数上的初始配置项
    const superOptions = resolveConstructorOptions(Ctor.super)
    const cachedSuperOptions = Ctor.superOptions
    // 如果与当前构造函数上的options 不一致
    if (superOptions !== cachedSuperOptions) {
      // super option changed,
      // need to resolve new options.
      // 缓存 supper options 在当前实例
      Ctor.superOptions = superOptions
      // check if there are any late-modified/attached options (#4976)
      // 获取差异选项
      const modifiedOptions = resolveModifiedOptions(Ctor)
      // update base extend options
      if (modifiedOptions) {
        // 与 Object.assign 作用 类似 合并 modifiedOptions 到 extendOptions
        extend(Ctor.extendOptions, modifiedOptions)
      }
      // 合并 返回一个新对象
      options = Ctor.options = mergeOptions(superOptions, Ctor.extendOptions)
      if (options.name) {
        options.components[options.name] = Ctor
      }
    }
  }
  return options
}

function resolveModifiedOptions (Ctor: Class<Component>): ?Object {
  let modified
  const latest = Ctor.options
  const sealed = Ctor.sealedOptions
  for (const key in latest) {
    if (latest[key] !== sealed[key]) {
      if (!modified) modified = {}
      modified[key] = latest[key]
    }
  }
  return modified
}
