---
title: Java并发编程
date: 2020-10-05
categories:
- Java
author: jyc
---

# 前言

并发编程相比于Java中其他知识点的学习门槛要高很多，从而导致很多人望而却步，但无论是职场面试，还是高并发/高流量系统的实现，却都离不开并发编程。

全文大致共分为三个部分，第一部分为Java并发编程基础篇，主要讲解Java并发编程的基础知识、线程有关的知识和并发编程中的其他概念，这些知识在后续的章节中都会用到。第二部分为Java并发编程的高级篇，讲解Java并发包中的核心组件的实现原理。第三部分为Java并发编程实践篇，主要讲解并发组件的使用方法，以及一些注意事项。

本文主要结合张龙老师的视频：[精通Java并发](https://www.bilibili.com/video/BV1qK4y1t78Z?from=search&seid=2031440298446612503)，以及《Java并发编程之美》，系统而全面的介绍Java并发的方方面面。

# 并发编程基础

## Thread和Runnable

Thread类和Runnable接口无疑是了解Java并发编程的入口，Thread类本身是实现了Runnable接口的：

```java
public class Thread implements Runnable {
    // ...
}
```

首先我们来阅读以下Thread类的文档说明：

```txt
A thread is a thread of execution in a program. The Java Virtual Machine allows an application to have 
multiple threads of execution running concurrently.
```

一个thread指的是程序执行中的一个线程，Java虚拟机支持一个应用可以有多个并发执行的线程。

```txt
Every thread has a priority. Threads with higher priority are executed in preference to threads with 
lower priority. Each thread may or may not also be marked as a daemon. When code running in some thread 
creates a new Thread object, the new thread has its priority initially set equal to the priority of the 
creating thread, and is a daemon thread if and only if the creating thread is a daemon.
```

每一个线程都会有一个优先级，拥有高优先级的线程在执行的时候就会比低优先级的线程优先级要高，每一个线程也可以被标记为daemon（后台线程），当运行在某一个线程中的代码创建了一个新的线程，默认情况下，新的线程的优先级会和创建它的线程优先级相同，并且只有创建它的线程是daemon线程时，新的线程才会是daemon。

```txt
When a Java Virtual Machine starts up, there is usually a single non-daemon thread (which typically calls 
the method named main of some designated class). The Java Virtual Machine continues to execute threads 
until either of the following occurs:
```

当Java虚拟机启动的时候，通常会有一个单个的、非daemon线程（通常情况会调用某一个被指定类的main方法），Java虚拟机会继续执行线程，直到下面的两种情况发生：

```txt
The exit method of class Runtime has been called and the security manager has permitted the exit 
operation to take place.
All threads that are not daemon threads have died, either by returning from the call to the run method or 
by throwing an exception that propagates beyond the run method.
```

- 类的Runtime方法被调用，并且安全管理器允许退出操作发生。
- 所有的非后台线程都已经消亡了，要么是通过run方法的调用返回了，要么是run方法外面抛出了异常。

```txt
There are two ways to create a new thread of execution. One is to declare a class to be a subclass of 
Thread. This subclass should override the run method of class Thread. An instance of the subclass can 
then be allocated and started. For example, a thread that computes primes larger than a stated value 
could be written as follows:
```

有两种方式来创建一个新的执行线程，一种是继承Thread类，这个子类应该重写Thread类的run方法，这个子类就可以创建实例并且执行，比如，一个线程计算大于某一个状态值的，可以这样做：

```java
class PrimeThread extends Thread {
           long minPrime;
           PrimeThread(long minPrime) {
               this.minPrime = minPrime;
           }
  
           public void run() {
               // compute primes larger than minPrime
                . . .
           }
       }
```

如下代码将会生成线程并且使用start方法开始执行：

```java
 PrimeThread p = new PrimeThread(143);
 p.start();
```

接下来是另外一种创建线程的方式：

```txt
The other way to create a thread is to declare a class that implements the Runnable interface. That class 
then implements the run method. An instance of the class can then be allocated, passed as an argument 
when creating Thread, and started. The same example in this other style looks like the following:
```

另一种创建线程的方式就是声明一个类并且实现Runnable接口，在这个类实现了run方法之后，就可以创建实例。当创建Thread的时候把这个类作为一个参数传入并启动，相同的例子用这个方式来实现，代码如下：

```java
 class PrimeRun implements Runnable {
           long minPrime;
           PrimeRun(long minPrime) {
               this.minPrime = minPrime;
           }
  
           public void run() {
               // compute primes larger than minPrime
                . . .
           }
       }
```

如下代码就会创建一个线程并执行：

```java
PrimeRun p = new PrimeRun(143);
new Thread(p).start();
```

```txt
Every thread has a name for identification purposes. More than one thread may have the same name. If a 
name is not specified when a thread is created, a new name is generated for it.
Unless otherwise noted, passing a null argument to a constructor or method in this class will cause a 
NullPointerException to be thrown.
```

每个线程都有一个名称用于标识，不同的线程可能会有相同的名称，如果创建线程的时候没有指定名称，就会产生一个新的名称，如无特别说明，将null参数传递给构造方法或者这个类的其他方法就会导致空指针异常。

这里用到了start方法来启动线程，我们来阅读以下start方法的说明：

```txt
Causes this thread to begin execution; the Java Virtual Machine calls the run method of this thread.
The result is that two threads are running concurrently: the current thread (which returns from the call 
to the start method) and the other thread (which executes its run method).
It is never legal to start a thread more than once. In particular, a thread may not be restarted once it
has completed execution.
```

当调用了start方法意味这个这个线程开始执行了，Java虚拟机会调用这个线程的run方法，结果是当前线程（调用start方法所返回的线程）和另外一个线程（执行run方法的线程）会并发的运行，多次启动一个线程是不合法的，特别的，一个线程已经执行完成之后不可以被重新启动。

Runnable接口本身是一个函数式接口，里面有且仅有一个抽象方法run方法：

```java
@FunctionalInterface
public interface Runnable {
    public abstract void run();
}
```

接下来我们阅读以下Runnable接口的文档说明：

```txt
The Runnable interface should be implemented by any class whose instances are intended to be executed by 
a thread. The class must define a method of no arguments called run.
This interface is designed to provide a common protocol for objects that wish to execute code while they 
are active. For example, Runnable is implemented by class Thread. Being active simply means that a thread 
has been started and has not yet been stopped.
```

任何一个执行线程的类都应该实现Runnable接口，这个类必须定义一个无参的run方法。设计这个接口是为了，给执行处在激活状态的代码的时候，提供一种公共的协议，比如说，Runnable是被Thread类所实现出来了。处于激活状态表示一个线程被启动了，而且没有停止。

```txt
In addition, Runnable provides the means for a class to be active while not subclassing Thread. A class 
that implements Runnable can run without subclassing Thread by instantiating a Thread instance and 
passing itself in as the target. In most cases, the Runnable interface should be used if you are only 
planning to override the run() method and no other Thread methods. This is important because classes 
should not be subclassed unless the programmer intends on modifying or enhancing the fundamental behavior
of the class.
```

此外，Runnable提供了让一个类处在激活状态同时又没有子类化的方式，一个类实现了Runnable可以不用通过子类化来运行，这是通过初始化一个Thread实例，然后将它自己作为目标传入，如果你只是计划重写run方法，而不打算重写Thread类其他的方法，一般情况下，都应该使用Runnable，这是非常重要的，除非程序员打算增强或修改一些基础的行为，因为类不应该被子类化。

接下来我们阅读以下run方法的说明：

```txt
When an object implementing interface Runnable is used to create a thread, starting the thread causes the 
object's run method to be called in that separately executing thread.
The general contract of the method run is that it may take any action whatsoever.
```

当使用实现了Runnable接口的对象创建了一个线程，启动这个线程，就会在单独执行的线程上执行这个类的run方法，run方法一种通用的锲约是它可以接口任何的动作。

同样的在Thread类中也有一个run方法：

```txt
If this thread was constructed using a separate Runnable run object, then that Runnable object's run 
method is called; otherwise, this method does nothing and returns.
Subclasses of Thread should override this method.
```

如果这个线程是通过单独的Runnable接口对象来构建的话，那么Runnable对象的run方法就会被调用，否则，这个方法什么都不做，直接返回。Thread的子类应该重写这个方法。

方法的实现：

```java
    @Override
    public void run() {
        // private Runnable target;
        if (target != null) {
            target.run();
        }
    }
```

Thread类的run方法会判断本地的Runnable对象是否已经被赋值，如果已经赋值了就执行里面的run方法。

Thread类的构造方法都会调用init方法：

```java
    public Thread(Runnable target) {
        init(null, target, "Thread-" + nextThreadNum(), 0);
    }
```

这里我们先了解以下这个init方法，方法的参数说明：

```java
// 线程组
g – the Thread group
// 这个对象的run将会被调用
target – the object whose run将会被调用() method gets called
// 新创建的线程的名称
name – the name of the new Thread
// 新的线程所需要的栈的大小，0表示这个参数会忽略掉
stackSize – the desired stack size for the new thread, or zero to indicate that this parameter is to be ignored.
```

## wait、sleep和notify

### 方法简介

在Object类中有几个与线程相关的方法：notify、notifyAll、wait，这几个方法非常的重要，接下来我们分析一下这个几个方法，首先从wait方法开始，wait方法又有几个重载的方法，首先来看不带参数的wait方法：

```txt
Causes the current thread to wait until another thread invokes the notify() method or the notifyAll() 
method for this object. In other words, this method behaves exactly as if it simply performs the call 
wait(0).
```

wait方法会导致当前的线程进入等待状态，直到另外一个线程调用了这个对象的notify或者notifyAll方法，换言之，这个方法的行为是与wait(0)是等价的。

```txt
The current thread must own this object's monitor. The thread releases ownership of this monitor and 
waits until another thread notifies threads waiting on this object's monitor to wake up either through a 
call to the notify method or the notifyAll method. The thread then waits until it can re-obtain ownership
of the monitor and resumes execution.
As in the one argument version, interrupts and spurious wakeups are possible, and this method should 
always be used in a loop:
```

要调用当前对象wait方法，当前线程必须要拥有这个对象的锁，这个线程在调用了wait方法之后，就会释放掉锁的控制权，并且进行等待，直到另外的线程通知在这个锁上等待的所有线程。唤醒的方式要么是通过notify方法或者是notifyAll方法。接下来，这个线程还是会继续等待，直到它可以重新获取锁的有用权，并且恢复执行。对于一个参数的版本来说，终端和一些虚假的唤醒是可能发生的，这个方法应该只在循环当中使用：

```java
synchronized (obj) {
               while (<condition does not hold>)
                   obj.wait();
               ... // Perform action appropriate to condition
           }
```

```txt
This method should only be called by a thread that is the owner of this object's monitor. See the notify 
method for a description of the ways in which a thread can become the owner of a monitor.
```

这个方法应该只是被拥有了这个对象的锁的线程去调用，参考notify方法来查看什么情况下，一个线程可以成为锁的拥有者。

如果没有锁直接调用wait方法会怎么样呢？

```java
public class MyTest1 {
    public static void main(String[] args) throws Exception{
        Object object = new Object();
        object.wait();
    }
}
```

程序就会直接抛出异常：

```java
Exception in thread "main" java.lang.IllegalMonitorStateException
```

按照给出的示例，我们将程序改写如下：

```java
public class MyTest1 {
    public static void main(String[] args) throws Exception{
        Object object = new Object();
        synchronized (object) {
            object.wait();
        }
    }
}
```

程序并没有抛出异常，而是进入进入了一直等待的状态。在Thread类中有一个sleep方法：

```txt
Causes the currently executing thread to sleep (temporarily cease execution) for the specified number of
milliseconds, subject to the precision and accuracy of system timers and schedulers. The thread does not 
lose ownership of any monitors.
```

它会导致当前正在执行的线程进入到休眠的状态（临时的终止执行）一段指定的毫秒数，它会收到系统定时器和调度器的精度的限制，线程并不会失去任何锁的所有权。

这里其实就是wait方法和sleep方法的最明显的区别，调用wait方法之前，线程必须持有对象的锁，在调用wait方法之后，线程就会释放锁，而sleep方法则不会释放掉锁。

前面我们提到过，不带参数的wait方法会调用他的重载方法：

```java
    public final void wait() throws InterruptedException {
        wait(0);
    }
```

wait方法本身又有两个重载的方法，我们首先来阅读一下只有一个参数的相关文档：

首先是方法的定义：

```java
  public final native void wait(long timeout) throws InterruptedException;
```

方法的说明：

```txt
Causes the current thread to wait until either another thread invokes the notify() method or the 
notifyAll() method for this object, or a specified amount of time has elapsed.
The current thread must own this object's monitor.
```

这个方法会让当前的线程进入等待状态，除非对当前这个对象使用notify或者notifyAll方法，或者已经到了指定的超时时间，当前对象必须要拥有当前对象的锁。

```txt
This method causes the current thread (call it T) to place itself in the wait set for this object and 
then to relinquish any and all synchronization claims on this object. Thread T becomes disabled for 
thread scheduling purposes and lies dormant until one of four things happens:
```

这个方法会导致当前的线程（T），将它自身放置到一个这个对象的等待集合当中，然后放弃任何同步的声明，线程T将无法再进行调度，处在休眠状态，直到下面的四种情况发生：

```txt
Some other thread invokes the notify method for this object and thread T happens to be arbitrarily chosen
as the thread to be awakened.
Some other thread invokes the notifyAll method for this object.
Some other thread interrupts thread T.
The specified amount of real time has elapsed, more or less. If timeout is zero, however, then real time
is not taken into consideration and the thread simply waits until notified.
```

- 另外一个线程调用了这个对象的notify方法，当前的线程T碰巧是要被选择唤醒的线程；
- 其他的线程调用了这个对象的notifyAll方法；
- 其他的线程中断了T线程
- 指定的时间已经过去了，不过如果时间设置为0的话，线程会一直进入等待直到被通知，而不会再去计算时间。

```txt
The thread T is then removed from the wait set for this object and re-enabled for thread scheduling. It 
then competes in the usual manner with other threads for the right to synchronize on the object; once it 
has gained control of the object, all its synchronization claims on the object are restored to the status 
quo ante - that is, to the situation as of the time that the wait method was invoked. Thread T then 
returns from the invocation of the wait method. Thus, on return from the wait method, the synchronization 
state of the object and of thread T is exactly as it was when the wait method was invoked.
```

接下来线程T会从对象等待集合中移除掉，然后，重新又可以进行线程的调度了。它会按照通常的方式与其他的线程竞争对于对象的同步权，一旦获得了对象的同步权，所有它的对这个对象同步的声明又会恢复到之前的同步声明状态，也就是说恢复到wait方法被调用的时候所处的状态，接下来线程T就会从wait方法的调用当中去返回，返回的时候，对象的同步状态以及线程T的同步状态与wait方法被调用的时候的状态是一模一样的。

```txt
A thread can also wake up without being notified, interrupted, or timing out, a so-called spurious 
wakeup. While this will rarely occur in practice, applications must guard against it by testing for the 
condition that should have caused the thread to be awakened, and continuing to wait if the condition is 
not satisfied. In other words, waits should always occur in loops, like this one:
```

一个线程还可以被唤醒无需被通知、中断或者超时，这个称之为虚假的唤醒，虽然这种实际情况下很少发生，但是应用还是应该通过测试条件保证这一点，并且如果条件没有被满足的时候就持续处于等待状态，换句话说，等待总是应该发生在循环当中，就向下面的代码：

```java
 synchronized (obj) {
               while (<condition does not hold>)
                   obj.wait(timeout);
               ... // Perform action appropriate to condition
           }
```

```txt
If the current thread is interrupted by any thread before or while it is waiting, then an 
InterruptedException is thrown. This exception is not thrown until the lock status of this object has 
been restored as described above.
```

如果当前的线程被别的线程在它等待之前或等待当中的时候被中断了，这个锁状态恢复之后才会被正常的抛出InterruptedException异常。

```txt
Note that the wait method, as it places the current thread into the wait set for this object, unlocks 
only this object; any other objects on which the current thread may be synchronized remain locked while 
the thread waits.
```

wait方法会将当前的线程放置到它的等待的对象集合当中，只会解锁当前的对象，当这个线程等待的时候，任何其它的对象对象可能会依然处于锁定的状态。

```txt
This method should only be called by a thread that is the owner of this object's monitor. See the notify 
method for a description of the ways in which a thread can become the owner of a monitor.
```

这个方法应该只被持有对象锁的线程所调用，请查看notify方法来查看如何让一个线程成为锁的拥有者。

接下来我们查看wait方法另外一个重载的方法：

```java
    public final void wait(long timeout, int nanos) throws InterruptedException {
        if (timeout < 0) {
            throw new IllegalArgumentException("timeout value is negative");
        }

        if (nanos < 0 || nanos > 999999) {
            throw new IllegalArgumentException(
                                "nanosecond timeout value out of range");
        }

        if (nanos > 0) {
            timeout++;
        }
        // 底层实现还是调用wait(long timeout)方法

        wait(timeout);
    }
```

wait方法和notify方法总是成对出现的，notify方法也是一个native方法：

```java
 public final native void notify();
```

我们来了解一下notify方法的作用：

```AsciiDoc
Wakes up a single thread that is waiting on this object's monitor. If any threads are waiting on this 
object, one of them is chosen to be awakened. The choice is arbitrary and occurs at the discretion of the
implementation. A thread waits on an object's monitor by calling one of the wait methods.
```

它会唤醒正在等待这个对象的锁的单个线程，如果有多个线程都在等待这个对象的锁，那么就会选择其中的一个进行唤醒，选择是随机的，并且是根据实现来决定的，一个线程会通过调用某一个wait方法进入等待状态。

```txt
The awakened thread will not be able to proceed until the current thread relinquishes the lock on this
object. The awakened thread will compete in the usual manner with any other threads that might be 
actively competing to synchronize on this object; for example, the awakened thread enjoys no reliable
privilege or disadvantage in being the next thread to lock this object.
This method should only be called by a thread that is the owner of this object's monitor. A thread  
becomes the owner of the object's monitor in one of three ways:    
```

被唤醒的线程是无法执行的，直到当前的线程放弃了这个对象的锁，被唤醒的线程会按照常规的方式与其他的线程进行对象同步的竞争，比如说，被唤醒的线程它是没有任何的特权，也没有任何不足的地方，都有可能会获得当前对象的锁。notify方法只能被这个对象的持有者来进行调用，一个线程获取对象锁有以下三种方式：

```text
By executing a synchronized instance method of that object.
By executing the body of a synchronized statement that synchronizes on the object.
For objects of type Class, by executing a synchronized static method of that class.
```

- 通过执行对象的synchronized实例方法来获取
- 通过执行这个对象的synchronized语句块来获取
- 对于Class类型的对象，通过执行这个class中synchronized静态方法来获取

```txt
Only one thread at a time can own an object's monitor.  
```

在某一个时刻只有一个线程拥有一个对象的锁。

同样的，notifyAll方法也是一个本地方法：

```java
  public final native void notifyAll();
```

方法的说明：

```txt
Wakes up all threads that are waiting on this object's monitor. A thread waits on an object's monitor by
calling one of the wait methods.
```

notifyAll方法会唤醒在这个对象的锁上等待的所有的线程，线程可以通过调用这个对象的wait方法等待这个对象的锁。

```txt
The awakened threads will not be able to proceed until the current thread relinquishes the lock on this 
object. The awakened threads will compete in the usual manner with any other threads that might be 
actively competing to synchronize on this object; for example, the awakened threads enjoy no reliable 
privilege or disadvantage in being the next thread to lock this object.
```

被唤醒的线程只有在当前对象释放掉锁的时候才能继续执行，它会按照通常的方式与其他的线程竞争对象的同步，既没有什么特权，也没有什么缺陷，都有可能是下一个给当前对象上锁的线程。

```txt
This method should only be called by a thread that is the owner of this object's monitor. See the notify
method for a description of the ways in which a thread can become the owner of a monitor.
```

这个方法只能被持有锁的对象锁调用，查看notify方法获取对象锁的方式。

我们可以用一张表格来总结以下wait、notify、notifyAll方法的区别：

|  方法名   |                             特点                             |
| :-------: | :----------------------------------------------------------: |
|   wait    | 1、当调用wait方法时，首先需要确保wait方法的线程已经持有了对象的锁<br>2、当调用wait后，该线程会释放掉这个对象的锁，然后进入到等待状态（wait set）<br>3、当线程调用了wait后进入等待状态时，它就可以等待线程调用相同对象的notify和notifyAll方法来使得自己被唤醒<br>4、一旦这个线程被其他线程唤醒后，该线程就会与其他线程一同开始竞争这个对象的锁（公平竞争）；只有当该线程获取到了这个对象的锁后，线程才会继续往下执行<br>5、调用wait方法的代码片段需要放在synchronize代码块或者synchronized方法中，这样才可以确保线程在调用wait方法前已经获取到了对象的锁 |
|  notify   | 1、当调用对象的notify方法时，它会随机唤醒该对象等待集合（wait set）中的任意一个线程，当某个线程被唤醒后，它就会与其他线程一同竞争对象的锁<br>2、在某一时刻只有唯一一个线程可以拥有对象的锁 |
| notifyAll | 1、当调用对象的notifyAll方法时，它会唤醒该对象集合（wait set）中所有的线程，这些线程被唤醒后，又会开始竞争对象的锁 |

### 方法实践

我们来看一个需要运用并发编程的实际的需求：

 1、存在一个对象，该对象有个int类型的成员变量counter，该成员变量的初始值为0；

2、创建两个线程，其中一个线程对该对象的成员变量counter加1，另一个线程对该对象的成员变量减1；

3、输出该对象成员变量counter每次变化后的值；

4、最终输出的结果应为：1010101010...。

首先是我们需要操作的对象：

```java
public class MyObject {
    // 需要操作的成员变量
    private int counter;

    public synchronized void increase() {
        if (counter != 0) {
            try {
                wait();
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
        counter++;
        System.out.println(counter);
        notify();
    }

    public synchronized void decrease() {
        if (counter == 0) {
            try {
                wait();
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
        counter--;
        System.out.println(counter);
        notify();
    }
}
```

增加的线程类：

```java
public class IncreaseThread extends Thread {
    private MyObject myObject;

    public IncreaseThread(MyObject myObject) {
        this.myObject = myObject;
    }

    @Override
    public void run() {
        for (int i = 0; i < 30; i++) {
            try {
                Thread.sleep((long) (Math.random() * 1000));
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
             myObject.increase();
        }
    }
}
```

减少的线程类：

```java
public class DecreaseThread extends Thread {
    private MyObject myObject;

    public DecreaseThread(MyObject myObject) {
        this.myObject = myObject;
    }

    @Override
    public void run() {
        for (int i = 0; i < 30; i++) {
            try {
                Thread.sleep((long) (Math.random() * 1000));
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            myObject.decrease();
        }
    }
}
```

我们使用客户端来进行测试：

```java
public class client {
    public static void main(String[] args) {
        MyObject myObject = new MyObject();
        Thread increaseThread = new IncreaseThread(myObject);
        Thread decreaseThread = new DecreaseThread(myObject);
        // 这里先启动哪个线程结果都是相同的
        increaseThread.start();
        decreaseThread.start();
    }
}
```

程序也正如我们所愿，输出了：

```txt
> Task :client.main()
1
0
1
0
1
0
1
0
1
0
1
0
1
0
```

接下来我们尝试创建多个线程

```java
public class client {
    public static void main(String[] args) {
        MyObject myObject = new MyObject();
        Thread increaseThread = new IncreaseThread(myObject);
        Thread increaseThread2 = new IncreaseThread(myObject);
        Thread decreaseThread = new DecreaseThread(myObject);
        Thread decreaseThread2 = new DecreaseThread(myObject);
        increaseThread.start();
        increaseThread2.start();
        decreaseThread.start();
        decreaseThread2.start();
    }
}
```

程序输出的结果：

```txt
> Task :client.main()
1
0
1
0
1
0
1
0
1
0
1
0
1
0
1
0
1
0
1
0
1
0
-1
-2
-3
-2
-1
-2
-3
-4
```

可以看到这个时候，输入的结果其实已经是没有规律的了。这是因为在之前只有两个线程的时候，调用notify方法一定会唤醒唯一的另外一个方法，而在上面的这个例子中，被唤醒的线程实际上是随机的。

为了避免这种情况的发生，我们应该使用while来进行判断，而不是使用if：

```java
public class MyObject {
    private int counter;

    public synchronized void increase() {
        while (counter != 0) {
            try {
                wait();
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
        counter++;
        System.out.println(counter);
        notify();
    }

    public synchronized void decrease() {
        while (counter == 0) {
            try {
                wait();
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
        counter--;
        System.out.println(counter);
        notify();
    }
}
```

 ## synchronized详解

### synchronized简介

我们首先来看一个例子：

```java
public class MyThreadTest {
    public static void main(String[] args) {
        Runnable r = new MyThread();
        // 传入的是同一个Runnable实例，都可以访问到成员变量x
        Thread t1 = new Thread(r);
        Thread t2 = new Thread(r);

        t1.start();
        t2.start();
    }
}

class MyThread implements Runnable {
    int x;

    @Override
    public void run() {
        x = 0;
        while (true) {
            System.out.println("result: " + x++);
            try {
                Thread.sleep((long) (Math.random() * 1000));
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            if (x == 30) {
                break;
            }
        }
    }
}
```

运行这个程序，实际上每次输出的结果都是不相同的，这两个线程实际上共享了成员变量x，如果一个对象有可以被修改的成员变量，我们就认为这个对象是可变的对象，或者称之为有状态的，反之，如果一个对象没有被修改的成员变量，那么我们称这个对象是无状态的。

```java
public class MyThreadTest2 {
    public static void main(String[] args) {
        MyClass myClass = new MyClass();
        Thread t1 = new Thread1(myClass);
        Thread t2 = new Thread2(myClass);
        t1.start();
        try {
            Thread.sleep(700);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        t2.start();
    }
}

class MyClass {
    public synchronized void hello() {
        try {
            Thread.sleep(400);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        System.out.println("hello");
    }

    public synchronized void world() {
        System.out.println("world");
    }
}

class Thread1 extends Thread {

    private MyClass myClass;

    public Thread1(MyClass myClass) {
        this.myClass = myClass;
    }

    @Override
    public void run() {
        myClass.hello();
    }
}

class Thread2 extends Thread {
    private MyClass myClass;

    public Thread2(MyClass myClass) {
        this.myClass = myClass;
    }

    @Override
    public void run() {
        myClass.world();
    }
}
```

程序输出：

```txt
> Task :MyThreadTest2.main()
hello
world
```

如果一个对象有若个synchronized方法，在某一个时刻只会有唯一的一个synchronized方法会被某一个线程访问，原因就在于当前对象的锁只有一个。当方法是static的时候，获取的锁不再是当前对象的锁，而是当前对象的Class的锁。

### synchronized字节码分析

synchronized关键字一般来说可以作用在代码块和方法当中，当作用在代码块的中的时候，一般会使用如下的方式：

```java
public class MyTest2 {
    private Object object = new Object();

    public void method() {
        // 获取到object对象的锁
        synchronized (object) {
            System.out.println("hello world");
        }
    }
}
```

使用命令进行反编译：

```shell
javap -c MyTest2.class
```

反编译的结果：

```java
public class concurrency2.MyTest2 {
  // 构造方法
  public concurrency2.MyTest2();
    Code:
       0: aload_0
       1: invokespecial #1                  // Method java/lang/Object."<init>":()V
       4: aload_0
       5: new           #2                  // class java/lang/Object
       8: dup
       9: invokespecial #1                  // Method java/lang/Object."<init>":()V
      12: putfield      #3                  // Field object:Ljava/lang/Object;
      15: return

  public void method();
    Code:
       0: aload_0
       // 获取当前对象的成员变量
       1: getfield      #3                  // Field object:Ljava/lang/Object;
       4: dup
       5: astore_1
       // 锁进入
       6: monitorenter
       // 开始执行代码
       7: getstatic     #4                  // Field java/lang/System.out:Ljava/io/PrintStream;
      10: ldc           #5                  // String hello world
      12: invokevirtual #6                  // Method java/io/PrintStream.println:(Ljava/lang/String;)V
      15: aload_1
      // 锁退出
      16: monitorexit
      17: goto          25
      20: astore_2
      21: aload_1
      // 处理异常退出锁的释放
      22: monitorexit
      23: aload_2
      24: athrow
      25: return
    Exception table:
       from    to  target type
           7    17    20   any
          20    23    20   any
}
```

这里有两个monitorexit的原因是，无论代码执行是否抛出了异常，都会释放掉锁的对象，这部分是由Java编译器所做的工作。

当我们使用synchronized关键字来修饰代码块时，字节码层面上是通过monitor与monitorexit指令来实现的锁的获取与释放动作，一个monitor可能对应一个或者多个monitorexit，为了说明这一点，我们修改一下代码：

```java
public class MyTest2 {
    private Object object = new Object();

    public void method() {
        // 获取到object对象的锁
        synchronized (object) {
            System.out.println("hello world");
            throw new RuntimeException();
        }
    }
}
```

这个时候反编译字节码就会得到：

```java
public class concurrency2.MyTest2 {
  public concurrency2.MyTest2();
    Code:
       0: aload_0
       1: invokespecial #1                  // Method java/lang/Object."<init>":()V
       4: aload_0
       5: new           #2                  // class java/lang/Object
       8: dup
       9: invokespecial #1                  // Method java/lang/Object."<init>":()V
      12: putfield      #3                  // Field object:Ljava/lang/Object;
      15: return

  public void method();
    Code:
       0: aload_0
       1: getfield      #3                  // Field object:Ljava/lang/Object;
       4: dup
       5: astore_1
       6: monitorenter
       7: getstatic     #4                  // Field java/lang/System.out:Ljava/io/PrintStream;
      10: ldc           #5                  // String hello world
      12: invokevirtual #6                  // Method java/io/PrintStream.println:(Ljava/lang/String;)V
      15: new           #7                  // class java/lang/RuntimeException
      18: dup
      // RuntimeException的构造方法
      19: invokespecial #8                  // Method java/lang/RuntimeException."<init>":()V
      22: athrow
      23: astore_2
      24: aload_1
      25: monitorexit
      26: aload_2
      27: athrow
    Exception table:
       from    to  target type
           7    26    23   any
}
```

为什么只有一个monitorexit呢？因为程序的出口只有一种，或者说程序运行的最终结果一定会抛出异常，这个时候athrow是一定会执行的，因此只有唯一的一个monitorexit。

当线程进入到monitorenter指令后，线程将会持有Monitor对象，退出monitorenter指令后，线程将会释放Moniter对象。

synchronized关键字除了可以作用在代码块上，还可以作用在方法上：

```java
public class MyTest3 {
    public synchronized void method() {
        System.out.println("hello world");
    }
}
```

同样反编译之后：

```java
{                                                                                                         
  public concurrency2.MyTest3();                                                                          
    descriptor: ()V                                                                                       
    flags: ACC_PUBLIC                                                                                     
    Code:                                                                                                 
      stack=1, locals=1, args_size=1                                                                      
         0: aload_0                                                                                       
         1: invokespecial #1                  // Method java/lang/Object."<init>":()V                     
         4: return                                                                                        
      LineNumberTable:                                                                                    
        line 8: 0                                                                                         
      LocalVariableTable:                                                                                 
        Start  Length  Slot  Name   Signature                                                             
            0       5     0  this   Lconcurrency2/MyTest3;                                                
                                                                                                          
  public synchronized void method();                                                                      
    descriptor: ()V                                                                                       	// ACC_SYNCHRONIZED表示这是一个synchronized方法
    flags: ACC_PUBLIC, ACC_SYNCHRONIZED                                                                   
    Code:                                                                                                 	//默认情况下参数的长度为1，是因为传入了当前对象
      stack=2, locals=1, args_size=1                                                                      
         0: getstatic     #2                  // Field java/lang/System.out:Ljava/io/PrintStream;         
         3: ldc           #3                  // String hello world                                       
         5: invokevirtual #4                  // Method java/io/PrintStream.println:(Ljava/lang/String;)V 
         8: return                                                                                        
      LineNumberTable:                                                                                    
        line 10: 0                                                                                        
        line 11: 8                                                                                        
      LocalVariableTable:                                                                                 
        Start  Length  Slot  Name   Signature                                                             
            0       9     0  this   Lconcurrency2/MyTest3;                                                
}                                                                                                       
```

synchronized关键字修饰方法与代码块不同的地方是，并没有通过monitorenter与monitorexit指令来描述，而是使用ACC_SYNCHRONIZED表示该方法被synchronized修饰。当方法被调用的时候，JVM会检查该方法是否拥有ACC_SYNCHRONIZED标志，如果有，那么执行线程将会持有方法所在的Monitor对象，然后再去执行方法体，在该方法执行期间，其他线程均无法再获取到这个Monitor对象，当线程执行完该方法后，它会释放掉这个Monitor对象。

synchronized关键字还有可能作用在静态方法上面：

```java
public class MyTest4 {
    public static synchronized void method() {
        System.out.println("hello world");
    }
}
```

反编译的结果：

```java
{                                                                                                          
  public concurrency2.MyTest4();                                                                           
    descriptor: ()V                                                                                        
    flags: ACC_PUBLIC                                                                                      
    Code:                                                                                                  
      stack=1, locals=1, args_size=1                                                                       
         0: aload_0                                                                                        
         1: invokespecial #1                  // Method java/lang/Object."<init>":()V                      
         4: return                                                                                         
      LineNumberTable:                                                                                     
        line 8: 0                                                                                          
      LocalVariableTable:                                                                                  
        Start  Length  Slot  Name   Signature                                                              
            0       5     0  this   Lconcurrency2/MyTest4;                                                 
                                                                                                           
  public static synchronized void method();                                                                
    descriptor: ()V
    //  ACC_STATIC表示静态的同步方法
    flags: ACC_PUBLIC, ACC_STATIC, ACC_SYNCHRONIZED                                                        
    Code:                                                                                                  
      stack=2, locals=0, args_size=0                                                                       
         0: getstatic     #2                  // Field java/lang/System.out:Ljava/io/PrintStream;          
         3: ldc           #3                  // String hello world                                        
         5: invokevirtual #4                  // Method java/io/PrintStream.println:(Ljava/lang/String;)V  
         8: return                                                                                         
      LineNumberTable:                                                                                     
        line 10: 0                                                                                         
        line 11: 8                                                                                         
}                                                                                                          
```

可以看到无论是修改实例方法还是静态方法，都是通过ACC_SYNCHRONIZED来实现的，静态方法还会增加ACC_STATIC来表示是静态方法。

## Monitor

### 自旋

JVM中的同步是基于进入与退出监视器对象（管程对象）（Monitor）来实现的，每个对象实例都会有一个Monitor对象，Monitor对象会和Java对象一同创建，一同销毁，Monitor对象是由C++来实现的。

当多个线程同时访问一段同步代码时，这些线程会被方法一个EntryList集合当中，处于阻塞状态的线程都会被方法该列表中。接下来，当线程获取到对象的Monitor时，Monitor是依赖于底层操作系统的mutex lock（互斥锁）来实现互斥的，线程获取mutex成功，则会持有mutex，这时其他线程就无法再获取到该mutex。

如果线程调用了wait方法，那么该线程就会释放掉所持有的mutex，并且该线程会进入到WaitSet集合（等待集合）中，等待下一次被其他线程调用notify/notifyAll唤醒。如果当前线程顺利执行完毕方法，那么它也会释放掉所持有的mutex。

同步锁再这种实现方式当中，因为Monitor是依赖于底层的操作系统实现，因此存在用户态与内核态之间的切换，所以会增加性能开销，通过对象互斥锁的概念来保证共享数据操作的完整性。每个对象都对应于一个可称为互斥锁的标记，这个标记用于保证在任何时刻，只能有一个线程访问该对象。

那些处于EntryList与WaitSet中的线程均处于阻塞状态，阻塞操作是由操作系统来完成的，在linux下是通过pthread_ mutex_lock函数实现的。线程被阻塞之后便会进入到内核调度方法，这会导致系统在用户态与内核态之间来回切换，严重影响锁的性能。

解决上述问题的办法便是自旋（Spin），其原理是：当发生对Monitor的争用时，如果Owner能够在很短的时间内释放掉锁，则那些正在争用的线程就是稍微等待一下（即自旋），在Owner线程释放锁之后，争用线程就有可能会立刻获取到锁，从而避免了系统阻塞。不过，当Owner运行的时间超过了临界值后，争用线程自旋一段时间后依然无法获取到锁，这时争用线程则会停止自旋进入到阻塞状态，所的来说：先自旋，不成功再进入阻塞状态，尽量降低阻塞的可能性，这对那些执行时间很短的代码块来说有极大的性能提升。显然，自旋在多核心处理器上才有意义。

### 互斥锁

互斥锁的属性：

1. PTHREAD_MUTEX_TIME_NP：这是缺省值，也就是普通锁，当一个线程加锁以后，其余请求锁的线程将会形成一个等待队列，并且在解锁后按照优先级获取到锁。这种策略可以确保资源分配的公平性。
2. PTHREAD_MUTEX_RECURSIVE_NP：嵌套锁，允许一个线程对同一个锁成功获取多次，并且通过unlock解锁，如果是不同线程请求，则在加锁线程解锁时重新进行竞争。
3. PTHREAD_MUTEX_ERRORCHECK_NP：检错锁，如果一个线程请求同一个锁，则返回EDEADLK，否则与PTHREAD_MUTEX_TIME_NP类型相同，这样就保证了当不允许多次加锁时出现最简单情况下的死锁。
4. PTHREAD_MUTEX_ADAPTIVE_NP：适应锁，动作最简单的锁类型，仅仅等待解锁后重新竞争。

### Monitor源码分析

接下来我们通过[openjdk](http://hg.openjdk.java.net/jdk8u/jdk8u/hotspot/file/73f624a2488d/src/share/vm/runtime)的源代码来分析Monitor底层的实现。

objectMonitor.hpp（头文件）和objectMonitor.cpp（具体的实现）这两个文件是关于Monitor的底层实现：

```c++
#ifndef SHARE_VM_RUNTIME_OBJECTMONITOR_HPP
#define SHARE_VM_RUNTIME_OBJECTMONITOR_HPP

#include "runtime/os.hpp"
#include "runtime/park.hpp"
#include "runtime/perfData.hpp"

// 阻塞在当前的Monitor上的线程的封装，是一种链表的结构：
class ObjectWaiter : public StackObj {
 public:
  enum TStates { TS_UNDEF, TS_READY, TS_RUN, TS_WAIT, TS_ENTER, TS_CXQ } ;
  enum Sorted  { PREPEND, APPEND, SORTED } ;
  // 前一个ObjectWaiter
  ObjectWaiter * volatile _next;
  // 后一个ObjectWaiter
  ObjectWaiter * volatile _prev;
  Thread*       _thread;
  jlong         _notifier_tid;
  ParkEvent *   _event;
  volatile int  _notified ;
  volatile TStates TState ;
  Sorted        _Sorted ;           // List placement disposition
  bool          _active ;           // Contention monitoring is enabled
 public:
  ObjectWaiter(Thread* thread);

  void wait_reenter_begin(ObjectMonitor *mon);
  void wait_reenter_end(ObjectMonitor *mon);
};

// Monitor对象
class ObjectMonitor {
 public:
  enum {
    OM_OK,                    // no error
    OM_SYSTEM_ERROR,          // operating system error
    OM_ILLEGAL_MONITOR_STATE, // IllegalMonitorStateException
    OM_INTERRUPTED,           // Thread.interrupt()
    OM_TIMED_OUT              // Object.wait() timed out
  };

 public:
  static int header_offset_in_bytes()      { return offset_of(ObjectMonitor, _header);     }
  static int object_offset_in_bytes()      { return offset_of(ObjectMonitor, _object);     }
  static int owner_offset_in_bytes()       { return offset_of(ObjectMonitor, _owner);      }
  static int count_offset_in_bytes()       { return offset_of(ObjectMonitor, _count);      }
  static int recursions_offset_in_bytes()  { return offset_of(ObjectMonitor, _recursions); }
  static int cxq_offset_in_bytes()         { return offset_of(ObjectMonitor, _cxq) ;       }
  static int succ_offset_in_bytes()        { return offset_of(ObjectMonitor, _succ) ;      }
  static int EntryList_offset_in_bytes()   { return offset_of(ObjectMonitor, _EntryList);  }
  static int FreeNext_offset_in_bytes()    { return offset_of(ObjectMonitor, FreeNext);    }
  static int WaitSet_offset_in_bytes()     { return offset_of(ObjectMonitor, _WaitSet) ;   }
  static int Responsible_offset_in_bytes() { return offset_of(ObjectMonitor, _Responsible);}
  static int Spinner_offset_in_bytes()     { return offset_of(ObjectMonitor, _Spinner);    }

 public:
  static int (*SpinCallbackFunction)(intptr_t, int) ;
  static intptr_t SpinCallbackArgument ;


 public:
  markOop   header() const;
  void      set_header(markOop hdr);

  intptr_t is_busy() const {
    return _count|_waiters|intptr_t(_owner)|intptr_t(_cxq)|intptr_t(_EntryList ) ;
  }

  intptr_t  is_entered(Thread* current) const;

  void*     owner() const;
  void      set_owner(void* owner);

  intptr_t  waiters() const;

  intptr_t  count() const;
  void      set_count(intptr_t count);
  intptr_t  contentions() const ;
  intptr_t  recursions() const                                         { return _recursions; }

  // JVM/DI GetMonitorInfo() needs this
  ObjectWaiter* first_waiter()                                         { return _WaitSet; }
  ObjectWaiter* next_waiter(ObjectWaiter* o)                           { return o->_next; }
  Thread* thread_of_waiter(ObjectWaiter* o)                            { return o->_thread; }

  // 初始化Monitor对象，除了semaphore都是简单的对象或者指针
  ObjectMonitor() {
    _header       = NULL;
    _count        = 0;
    _waiters      = 0,
    _recursions   = 0;
    _object       = NULL;
    _owner        = NULL;
    // 等待集合
    _WaitSet      = NULL;
    _WaitSetLock  = 0 ;
    _Responsible  = NULL ;
    _succ         = NULL ;
    _cxq          = NULL ;
    FreeNext      = NULL ;
     // 等待集合
    _EntryList    = NULL ;
    _SpinFreq     = 0 ;
    _SpinClock    = 0 ;
    OwnerIsThread = 0 ;
    _previous_owner_tid = 0;
  }

  ~ObjectMonitor() {
   // TODO: Add asserts ...
   // _cxq == 0 _succ == NULL _owner == NULL _waiters == 0
   // _count == 0 _EntryList  == NULL etc
  }

private:
  void Recycle () {
    // TODO: add stronger asserts ...
    // _cxq == 0 _succ == NULL _owner == NULL _waiters == 0
    // _count == 0 EntryList  == NULL
    // _recursions == 0 _WaitSet == NULL
    // TODO: assert (is_busy()|_recursions) == 0
    _succ          = NULL ;
    _EntryList     = NULL ;
    _cxq           = NULL ;
    _WaitSet       = NULL ;
    _recursions    = 0 ;
    _SpinFreq      = 0 ;
    _SpinClock     = 0 ;
    OwnerIsThread  = 0 ;
  }

public:

  void*     object() const;
  void*     object_addr();
  void      set_object(void* obj);

  bool      check(TRAPS);       // true if the thread owns the monitor.
  void      check_slow(TRAPS);
  void      clear();
  static void sanity_checks();  // public for -XX:+ExecuteInternalVMTests
                                // in PRODUCT for -XX:SyncKnobs=Verbose=1
#ifndef PRODUCT
  void      verify();
  void      print();
#endif

  bool      try_enter (TRAPS) ;
  void      enter(TRAPS);
  void      exit(bool not_suspended, TRAPS);
  void      wait(jlong millis, bool interruptable, TRAPS);
  void      notify(TRAPS);
  void      notifyAll(TRAPS);

// Use the following at your own risk
  intptr_t  complete_exit(TRAPS);
  void      reenter(intptr_t recursions, TRAPS);

 private:
  void      AddWaiter (ObjectWaiter * waiter) ;
  static    void DeferredInitialize();

  ObjectWaiter * DequeueWaiter () ;
  void      DequeueSpecificWaiter (ObjectWaiter * waiter) ;
  void      EnterI (TRAPS) ;
  void      ReenterI (Thread * Self, ObjectWaiter * SelfNode) ;
  void      UnlinkAfterAcquire (Thread * Self, ObjectWaiter * SelfNode) ;
  int       TryLock (Thread * Self) ;
  int       NotRunnable (Thread * Self, Thread * Owner) ;
  int       TrySpin_Fixed (Thread * Self) ;
  int       TrySpin_VaryFrequency (Thread * Self) ;
  int       TrySpin_VaryDuration  (Thread * Self) ;
  void      ctAsserts () ;
  void      ExitEpilog (Thread * Self, ObjectWaiter * Wakee) ;
  bool      ExitSuspendEquivalent (JavaThread * Self) ;

 private:
  friend class ObjectSynchronizer;
  friend class ObjectWaiter;
  friend class VMStructs;

  // WARNING: this must be the very first word of ObjectMonitor
  // This means this class can't use any virtual member functions.

  volatile markOop   _header;       // displaced object header word - mark
  void*     volatile _object;       // backward object pointer - strong root

  double SharingPad [1] ;           // temp to reduce false sharing

  // All the following fields must be machine word aligned
  // The VM assumes write ordering wrt these fields, which can be
  // read from other threads.
 // 锁的持有者
 protected:                         // protected for jvmtiRawMonitor
  void *  volatile _owner;          // pointer to owning thread OR BasicLock
  volatile jlong _previous_owner_tid; // thread id of the previous owner of the monitor
  volatile intptr_t  _recursions;   // recursion count, 0 for first entry
 private:
  int OwnerIsThread ;               // _owner is (Thread *) vs SP/BasicLock
  ObjectWaiter * volatile _cxq ;    // LL of recently-arrived threads blocked on entry.
                                    // The list is actually composed of WaitNodes, acting
 // 没获取到锁的线程                                   // as proxies for Threads.
 protected:
  ObjectWaiter * volatile _EntryList ;     // Threads blocked on entry or reentry.
 private:
  Thread * volatile _succ ;          // Heir presumptive thread - used for futile wakeup throttling
  Thread * volatile _Responsible ;
  int _PromptDrain ;                // rqst to drain cxq into EntryList ASAP

  volatile int _Spinner ;           // for exit->spinner handoff optimization
  volatile int _SpinFreq ;          // Spin 1-out-of-N attempts: success rate
  volatile int _SpinClock ;
  volatile int _SpinDuration ;
  volatile intptr_t _SpinState ;    // MCS/CLH list of spinners

  // TODO-FIXME: _count, _waiters and _recursions should be of
  // type int, or int32_t but not intptr_t.  There's no reason
  // to use 64-bit fields for these variables on a 64-bit JVM.

  volatile intptr_t  _count;        // reference count to prevent reclaimation/deflation
                                    // at stop-the-world time.  See deflate_idle_monitors().
                                    // _count is approximately |_WaitSet| + |_EntryList|
 protected:
  volatile intptr_t  _waiters;      // number of waiting threads
 private:
    // 等待集合定义
 protected:
  ObjectWaiter * volatile _WaitSet; // LL of threads wait()ing on the monitor
    // 等待队列,简单的自旋锁
 private:
  volatile int _WaitSetLock;        // protects Wait Queue - simple spinlock

 public:
  int _QMix ;                       // Mixed prepend queue discipline
  ObjectMonitor * FreeNext ;        // Free list linkage
  intptr_t StatA, StatsB ;

 public:
  static void Initialize () ;
  static PerfCounter * _sync_ContendedLockAttempts ;
  static PerfCounter * _sync_FutileWakeups ;
  static PerfCounter * _sync_Parks ;
  static PerfCounter * _sync_EmptyNotifications ;
  static PerfCounter * _sync_Notifications ;
  static PerfCounter * _sync_SlowEnter ;
  static PerfCounter * _sync_SlowExit ;
  static PerfCounter * _sync_SlowNotify ;
  static PerfCounter * _sync_SlowNotifyAll ;
  static PerfCounter * _sync_FailedSpins ;
  static PerfCounter * _sync_SuccessfulSpins ;
  static PerfCounter * _sync_PrivateA ;
  static PerfCounter * _sync_PrivateB ;
  static PerfCounter * _sync_MonInCirculation ;
  static PerfCounter * _sync_MonScavenged ;
  static PerfCounter * _sync_Inflations ;
  static PerfCounter * _sync_Deflations ;
  static PerfLongVariable * _sync_MonExtant ;

 public:
  static int Knob_Verbose;
  static int Knob_SpinLimit;
  void* operator new (size_t size) throw() {
    return AllocateHeap(size, mtInternal);
  }
  void* operator new[] (size_t size) throw() {
    return operator new (size);
  }
  void operator delete(void* p) {
    FreeHeap(p, mtInternal);
  }
  void operator delete[] (void *p) {
    operator delete(p);
  }
};

#undef TEVENT
#define TEVENT(nom) {if (SyncVerbose) FEVENT(nom); }

#define FEVENT(nom) { static volatile int ctr = 0 ; int v = ++ctr ; if ((v & (v-1)) == 0) { ::printf (#nom " : %d \n", v); ::fflush(stdout); }}

#undef  TEVENT
#define TEVENT(nom) {;}

#endif
```

EntryList、WaitSet采用链表的方式是因为在这个链表中，要根据某一定的规则查找、删除、增加线程比较容易。只有经过wait方法调用的时候，才会进入到WaitSet集合当中。

### wait、notify源码分析

wait方法的实现：

```c++
void ObjectMonitor::wait(jlong millis, bool interruptible, TRAPS) {
   Thread * const Self = THREAD ;
   assert(Self->is_Java_thread(), "Must be Java thread!");
   JavaThread *jt = (JavaThread *)THREAD;

   DeferredInitialize () ;

   // Throw IMSX or IEX.
   CHECK_OWNER();

   EventJavaMonitorWait event;

   // check for a pending interrupt
   if (interruptible && Thread::is_interrupted(Self, true) && !HAS_PENDING_EXCEPTION) {
     // post monitor waited event.  Note that this is past-tense, we are done waiting.
     if (JvmtiExport::should_post_monitor_waited()) {
        // Note: 'false' parameter is passed here because the
        // wait was not timed out due to thread interrupt.
        JvmtiExport::post_monitor_waited(jt, this, false);

        // In this short circuit of the monitor wait protocol, the
        // current thread never drops ownership of the monitor and
        // never gets added to the wait queue so the current thread
        // cannot be made the successor. This means that the
        // JVMTI_EVENT_MONITOR_WAITED event handler cannot accidentally
        // consume an unpark() meant for the ParkEvent associated with
        // this ObjectMonitor.
     }
     if (event.should_commit()) {
       post_monitor_wait_event(&event, this, 0, millis, false);
     }
     TEVENT (Wait - Throw IEX) ;
     THROW(vmSymbols::java_lang_InterruptedException());
     return ;
   }

   TEVENT (Wait) ;

   assert (Self->_Stalled == 0, "invariant") ;
   Self->_Stalled = intptr_t(this) ;
   jt->set_current_waiting_monitor(this);

   // create a node to be put into the queue
   // Critically, after we reset() the event but prior to park(), we must check
   // for a pending interrupt.
   ObjectWaiter node(Self);
   node.TState = ObjectWaiter::TS_WAIT ;
   Self->_ParkEvent->reset() ;
   OrderAccess::fence();          // ST into Event; membar ; LD interrupted-flag

   // Enter the waiting queue, which is a circular doubly linked list in this case
   // but it could be a priority queue or any data structure.
   // _WaitSetLock protects the wait queue.  Normally the wait queue is accessed only
   // by the the owner of the monitor *except* in the case where park()
   // returns because of a timeout of interrupt.  Contention is exceptionally rare
   // so we use a simple spin-lock instead of a heavier-weight blocking lock.

   Thread::SpinAcquire (&_WaitSetLock, "WaitSet - add") ;
    // 将封装好的node对象放到队列中，通过双向链表实现的
   AddWaiter (&node) ;
   Thread::SpinRelease (&_WaitSetLock) ;

   if ((SyncFlags & 4) == 0) {
      _Responsible = NULL ;
   }
   intptr_t save = _recursions; // record the old recursion count
   _waiters++;                  // increment the number of waiters
   _recursions = 0;             // set the recursion level to be 1
    // 释放掉锁
   exit (true, Self) ;                    // exit the monitor
   guarantee (_owner != Self, "invariant") ;

   // The thread is on the WaitSet list - now park() it.
   // On MP systems it's conceivable that a brief spin before we park
   // could be profitable.
   //
   // TODO-FIXME: change the following logic to a loop of the form
   //   while (!timeout && !interrupted && _notified == 0) park()

   int ret = OS_OK ;
   int WasNotified = 0 ;
   { // State transition wrappers
     OSThread* osthread = Self->osthread();
     OSThreadWaitState osts(osthread, true);
     {
       ThreadBlockInVM tbivm(jt);
       // Thread is in thread_blocked state and oop access is unsafe.
       jt->set_suspend_equivalent();

       if (interruptible && (Thread::is_interrupted(THREAD, false) || HAS_PENDING_EXCEPTION)) {
           // Intentionally empty
       } else
       if (node._notified == 0) {
         if (millis <= 0) {
            Self->_ParkEvent->park () ;
         } else {
            ret = Self->_ParkEvent->park (millis) ;
         }
       }

       // were we externally suspended while we were waiting?
       if (ExitSuspendEquivalent (jt)) {
          // TODO-FIXME: add -- if succ == Self then succ = null.
          jt->java_suspend_self();
       }

     } // Exit thread safepoint: transition _thread_blocked -> _thread_in_vm


     // Node may be on the WaitSet, the EntryList (or cxq), or in transition
     // from the WaitSet to the EntryList.
     // See if we need to remove Node from the WaitSet.
     // We use double-checked locking to avoid grabbing _WaitSetLock
     // if the thread is not on the wait queue.
     //
     // Note that we don't need a fence before the fetch of TState.
     // In the worst case we'll fetch a old-stale value of TS_WAIT previously
     // written by the is thread. (perhaps the fetch might even be satisfied
     // by a look-aside into the processor's own store buffer, although given
     // the length of the code path between the prior ST and this load that's
     // highly unlikely).  If the following LD fetches a stale TS_WAIT value
     // then we'll acquire the lock and then re-fetch a fresh TState value.
     // That is, we fail toward safety.

     if (node.TState == ObjectWaiter::TS_WAIT) {
         Thread::SpinAcquire (&_WaitSetLock, "WaitSet - unlink") ;
         if (node.TState == ObjectWaiter::TS_WAIT) {
            DequeueSpecificWaiter (&node) ;       // unlink from WaitSet
            assert(node._notified == 0, "invariant");
            node.TState = ObjectWaiter::TS_RUN ;
         }
         Thread::SpinRelease (&_WaitSetLock) ;
     }

     // The thread is now either on off-list (TS_RUN),
     // on the EntryList (TS_ENTER), or on the cxq (TS_CXQ).
     // The Node's TState variable is stable from the perspective of this thread.
     // No other threads will asynchronously modify TState.
     guarantee (node.TState != ObjectWaiter::TS_WAIT, "invariant") ;
     OrderAccess::loadload() ;
     if (_succ == Self) _succ = NULL ;
     WasNotified = node._notified ;

     // Reentry phase -- reacquire the monitor.
     // re-enter contended monitor after object.wait().
     // retain OBJECT_WAIT state until re-enter successfully completes
     // Thread state is thread_in_vm and oop access is again safe,
     // although the raw address of the object may have changed.
     // (Don't cache naked oops over safepoints, of course).

     // post monitor waited event. Note that this is past-tense, we are done waiting.
     if (JvmtiExport::should_post_monitor_waited()) {
       JvmtiExport::post_monitor_waited(jt, this, ret == OS_TIMEOUT);

       if (node._notified != 0 && _succ == Self) {
         // In this part of the monitor wait-notify-reenter protocol it
         // is possible (and normal) for another thread to do a fastpath
         // monitor enter-exit while this thread is still trying to get
         // to the reenter portion of the protocol.
         //
         // The ObjectMonitor was notified and the current thread is
         // the successor which also means that an unpark() has already
         // been done. The JVMTI_EVENT_MONITOR_WAITED event handler can
         // consume the unpark() that was done when the successor was
         // set because the same ParkEvent is shared between Java
         // monitors and JVM/TI RawMonitors (for now).
         //
         // We redo the unpark() to ensure forward progress, i.e., we
         // don't want all pending threads hanging (parked) with none
         // entering the unlocked monitor.
         node._event->unpark();
       }
     }

     if (event.should_commit()) {
       post_monitor_wait_event(&event, this, node._notifier_tid, millis, ret == OS_TIMEOUT);
     }

     OrderAccess::fence() ;

     assert (Self->_Stalled != 0, "invariant") ;
     Self->_Stalled = 0 ;

     assert (_owner != Self, "invariant") ;
     ObjectWaiter::TStates v = node.TState ;
     if (v == ObjectWaiter::TS_RUN) {
         enter (Self) ;
     } else {
         guarantee (v == ObjectWaiter::TS_ENTER || v == ObjectWaiter::TS_CXQ, "invariant") ;
         ReenterI (Self, &node) ;
         node.wait_reenter_end(this);
     }

     // Self has reacquired the lock.
     // Lifecycle - the node representing Self must not appear on any queues.
     // Node is about to go out-of-scope, but even if it were immortal we wouldn't
     // want residual elements associated with this thread left on any lists.
     guarantee (node.TState == ObjectWaiter::TS_RUN, "invariant") ;
     assert    (_owner == Self, "invariant") ;
     assert    (_succ != Self , "invariant") ;
   } // OSThreadWaitState()

   jt->set_current_waiting_monitor(NULL);

   guarantee (_recursions == 0, "invariant") ;
   _recursions = save;     // restore the old recursion count
   _waiters--;             // decrement the number of waiters

   // Verify a few postconditions
   assert (_owner == Self       , "invariant") ;
   assert (_succ  != Self       , "invariant") ;
   assert (((oop)(object()))->mark() == markOopDesc::encode(this), "invariant") ;

   if (SyncFlags & 32) {
      OrderAccess::fence() ;
   }

   // check if the notification happened
   if (!WasNotified) {
     // no, it could be timeout or Thread.interrupt() or both
     // check for interrupt event, otherwise it is timeout
     if (interruptible && Thread::is_interrupted(Self, true) && !HAS_PENDING_EXCEPTION) {
       TEVENT (Wait - throw IEX from epilog) ;
       THROW(vmSymbols::java_lang_InterruptedException());
     }
   }

   // NOTE: Spurious wake up will be consider as timeout.
   // Monitor notify has precedence over thread interrupt.
}
```

notify方法的实现：

```c++
void ObjectMonitor::notify(TRAPS) {
  CHECK_OWNER();
    // 等待集合为空
  if (_WaitSet == NULL) {
     TEVENT (Empty-Notify) ;
     return ;
  }
  DTRACE_MONITOR_PROBE(notify, this, object(), THREAD);
	// 不同的调度策略（具体唤醒哪一个线程），使用调度策略将这个ObjectWaiter放置到EntryList
  int Policy = Knob_MoveNotifyee ;

  Thread::SpinAcquire (&_WaitSetLock, "WaitSet - notify") ;
  ObjectWaiter * iterator = DequeueWaiter() ;
  if (iterator != NULL) {
     TEVENT (Notify1 - Transfer) ;
     guarantee (iterator->TState == ObjectWaiter::TS_WAIT, "invariant") ;
     guarantee (iterator->_notified == 0, "invariant") ;
     if (Policy != 4) {
        iterator->TState = ObjectWaiter::TS_ENTER ;
     }
     iterator->_notified = 1 ;
     Thread * Self = THREAD;
     iterator->_notifier_tid = JFR_THREAD_ID(Self);

     ObjectWaiter * List = _EntryList ;
     if (List != NULL) {
        assert (List->_prev == NULL, "invariant") ;
        assert (List->TState == ObjectWaiter::TS_ENTER, "invariant") ;
        assert (List != iterator, "invariant") ;
     }

     if (Policy == 0) {       // prepend to EntryList
         if (List == NULL) {
             iterator->_next = iterator->_prev = NULL ;
             _EntryList = iterator ;
         } else {
             List->_prev = iterator ;
             iterator->_next = List ;
             iterator->_prev = NULL ;
             _EntryList = iterator ;
        }
     } else
     if (Policy == 1) {      // append to EntryList
         if (List == NULL) {
             iterator->_next = iterator->_prev = NULL ;
             _EntryList = iterator ;
         } else {
            // CONSIDER:  finding the tail currently requires a linear-time walk of
            // the EntryList.  We can make tail access constant-time by converting to
            // a CDLL instead of using our current DLL.
            ObjectWaiter * Tail ;
            for (Tail = List ; Tail->_next != NULL ; Tail = Tail->_next) ;
            assert (Tail != NULL && Tail->_next == NULL, "invariant") ;
            Tail->_next = iterator ;
            iterator->_prev = Tail ;
            iterator->_next = NULL ;
        }
     } else
     if (Policy == 2) {      // prepend to cxq
         // prepend to cxq
         if (List == NULL) {
             iterator->_next = iterator->_prev = NULL ;
             _EntryList = iterator ;
         } else {
            iterator->TState = ObjectWaiter::TS_CXQ ;
            for (;;) {
                ObjectWaiter * Front = _cxq ;
                iterator->_next = Front ;
                if (Atomic::cmpxchg_ptr (iterator, &_cxq, Front) == Front) {
                    break ;
                }
            }
         }
     } else
     if (Policy == 3) {      // append to cxq
        iterator->TState = ObjectWaiter::TS_CXQ ;
        for (;;) {
            ObjectWaiter * Tail ;
            Tail = _cxq ;
            if (Tail == NULL) {
                iterator->_next = NULL ;
                if (Atomic::cmpxchg_ptr (iterator, &_cxq, NULL) == NULL) {
                   break ;
                }
            } else {
                while (Tail->_next != NULL) Tail = Tail->_next ;
                Tail->_next = iterator ;
                iterator->_prev = Tail ;
                iterator->_next = NULL ;
                break ;
            }
        }
     } else {
        ParkEvent * ev = iterator->_event ;
        iterator->TState = ObjectWaiter::TS_RUN ;
        OrderAccess::fence() ;
        ev->unpark() ;
     }

     if (Policy < 4) {
       iterator->wait_reenter_begin(this);
     }

     // _WaitSetLock protects the wait queue, not the EntryList.  We could
     // move the add-to-EntryList operation, above, outside the critical section
     // protected by _WaitSetLock.  In practice that's not useful.  With the
     // exception of  wait() timeouts and interrupts the monitor owner
     // is the only thread that grabs _WaitSetLock.  There's almost no contention
     // on _WaitSetLock so it's not profitable to reduce the length of the
     // critical section.
  }

  Thread::SpinRelease (&_WaitSetLock) ;

  if (iterator != NULL && ObjectMonitor::_sync_Notifications != NULL) {
     ObjectMonitor::_sync_Notifications->inc() ;
  }
}
```

### 锁升级与偏向锁

随着JDK版本的不断更迭，底层对于synchronized关键字的实现方式也不断地在进行调整。在JDK1.5之前，要实现线程同步，只能通过synchronized关键字来实现，Java底层也是通过synchronized关键字来做到数据的原子性维护，synchronized关键字是JVM实现的一种内置锁，从底层角度来说，这种锁的获取与释放都是由JVM帮助我们隐式实现的。从JDK1.5开始，并发包引入了Lock锁，Lock同步锁是基于Java来实现的，因此锁的获取与释放都是通过Java代码来实现与控制的，synchronized是基于底层操作系统Mutex Lock来实现的，每次对锁的获取与释放动作都会带来用户态与内核态之间的切换，这种切换会极大的增加系统的负担。在并发量较高时，也就是说锁的竞争比较激烈的时候，synchronized锁在性能上的表现就非常差。

从JDK1.6开始，synchronized锁的实现发生了很大的变化，JVM引入了相应的优化手段来提升synchronized锁的性能，这种提升涉及到偏向锁、轻量级锁、重量级锁等，从而减少锁的竞争锁带来的用户态与内核态之前的切换，这种锁的优化是通过Java对象头中的一些标志位来去实现的。对于锁的访问与改变，实际上都与Java对象头息息相关。

从JDK1.6开始，对象实例在堆当中会被划分为三个组成部分：对象头、实例数据与对齐填充。

对象头主要由3块内容来构成：

1. Mark Word 
2. 指向类的指针
3. 数组的长度

其中Mark Word （它记录了对象、锁及垃圾回收相关的信息，在64位的JVM中，其长度也是64bit）的位信息包括了如下的组成部分：

1. 无锁标记
2. 偏向锁标记
3. 轻量级锁标记
4. 重量级锁标记
5. GC标记

对于synchronized锁来说，锁的升级主要是通过Mark Word中的锁的标志位与是否是偏向锁标志位来达成的；synchronized关键字锁对应的锁都是从偏向锁开始，随着锁竞争的不断升级，逐步演化至轻量级锁，最后则变成了重量级锁。

对于锁的演化来说，它会经历如下阶段：

无锁 -> 偏向锁 -> 轻量级锁 -> 重量级锁

偏向锁：针对于一个线程来说，它的作用就是优化同一个线程多次获取一个锁的情况；如果一个synchronized方法被一个线程访问，那么这个方法所在的对象就会在其Mark Word中将偏向锁进行标记，同时还会有一个字段来存储该线程的ID；当这个线程再次访问同一个synchronized方法时，它会检查这个对象的Mark Word的偏向锁标记以及是否指向了其线程ID，如果是的话，那么该线程就无需进行管程（Monitor）了，而是直接进入到该方法体中。如果是另外一个线程访问这个synchronized方法，那么偏向锁的标记就会被去掉。

轻量级锁：若第一个线程已经获取到了当前对象的锁，这是第二个线程又开始尝试争抢该对象的锁，由于该对象的锁已经被第一个线程获取到，因此它是偏向锁，而第二个线程在争抢时，会发现该对象头中的Mark Word已经是偏向锁，但里面存储的线程ID不是自己（第一个线程），那么它会进行CAS（Compare and Swap），从而获取到锁，这里面存在两种情况：

1. 获取锁成功，那么它会直接将Mark Word中的线程ID由第一个线程变成自己（偏向锁标记位保持不变），这样该对象依然会保持偏向锁的状态
2. 获取锁失败，表示这时可能会有多个线程同时在尝试争抢该对象的锁，那么这时偏向锁会进行升级，升级为轻量级锁

自旋锁：若自旋失败（依然无法获取到锁），那么锁就会转化为重量级锁，在这种情况下，无法获取到锁的线程都会进入到Monitor（即内核态）。自旋最大的一个特点就是避免了线程从用户态进入到内核态。

重量级锁：线程最终从用户态进入到了内核态。

### 锁粗化与锁消除

```java
public class MyTest5 {
    private Object object = new Object();

    public void method() {
        synchronized (object) {
            System.out.println("hello world");
        }
    }
}
```

编译器对于锁的优化措施：JIT编译器（Just In Time编译器）可以在动态编译同步代码时，使用一种叫做逃逸分析的技术，来通过该项技术判别程序中所使用的锁对象是否只被一个线程所使用，而没有散布到其他线程当中，如果情况就是这样的话，那么JIT编译器在编译这个同步代码时就不会生成synchronized关键字所标识的锁的申请与释放机器码，从而消除了锁的使用流程，这就是锁的消除。

```java
public class MyTest6 {
    public void method() {
        Object object = new Object();
        synchronized (object) {
            System.out.println("hello world");
        }

        synchronized (object) {
            System.out.println("welcome");
        }

        synchronized (object) {
            System.out.println("person");
        }
    }
}
```

如果object是成员变量：

```java
public class MyTest6 {
    Object object = new Object();
    
    public void method() {
        synchronized (object) {
            System.out.println("hello world");
        }

        synchronized (object) {
            System.out.println("welcome");
        }

        synchronized (object) {
            System.out.println("person");
        }
    }
}
```

这种情况下就发生了：锁粗化，JIT编译器在执行动态编译时，若发现前后相邻的synchronized块使用的是同一个锁对象，那么它就会把这几个synchronized块合并为一个较大的同步块，这样做的好处在于线程在执行这些代码的时候，就无需频繁的申请与释放锁了，从而达到申请与释放锁一次，就可以执行完全部的同步代码块，从而提升了性能。

## Lock

### 死锁及死锁检测

