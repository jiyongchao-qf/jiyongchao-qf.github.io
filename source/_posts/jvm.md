---
title: 深入理解JVM
date: 2020-12-06
categories:
 - Java
tag: 
 - JVM
 - 垃圾回收
 - 类加载
author: 吉永超
---

时至今日，JVM的重要性已经不言而喻，但是JVM本身的复杂性使得了解其原理与运作方式是一件极其困难的事情，本篇主要结合张龙老师的视频：[深入理解JVM虚拟机](https://www.bilibili.com/video/BV187411B7iv)与《深入理解Java虚拟机》，系统而全面的介绍Java虚拟机的方方面面。

<!-- more -->
# 类加载

学习笔记地址：https://github.com/weolwo/jvm-learn.git

加载：查找并加载类的二进制数据

连接：

- 验证：确保被加载的类的正确性
- 准备：为类的静态资源变量分配内存，并将其初始化为默认值
- 解析：把类中的符号引用转换为直接引用

初始化：为类的静态变量赋予正确的初始值



Java程序对类的使用方式可分为两种：主动使用、被动使用

所有的Java虚拟机实现必须在每个类或者接口被Java程序“首次主动使用”时才初始化他们

主动使用（七种）：

1. 创建类的实例
2. 访问某个类或接口的静态变量，或者对该静态变量赋值
3. 调用类的静态方法
4. 反射
5. 初始化一个类的子类
6. Java虚拟机启动时被标明为启动类的类（Java Test）
7. JDK1.7开始提供的动态语言支持：Java.lang.invoke.MethodHandle实例的解析结果REF_getStatic，REF_putStatic，REF_invokeStatic句柄对应的类没有初始化则初始化



除了以上其中情况，其他使用Java类的方式都被看作时对类的被动使用，都不会导致了的初始化；



类的加载指的是将类的.class文件中的二进制数据读入到内存中，将其放在运行时数据区的方法区内，然后在内存中创建一个java.lang.Class对象（规范并未说明Class对象位于哪里，HotSpot虚拟机将其放在了方法区中）用来封装类在方法区内的数据结构



加载.class文件的方式

1. 从本地系统中直接加载
2. 通过网络下载.class文件
3. 从zip，jar等归档文件中加载.class文件
4. 从专有数据库中提取.class文件
5. 将Java源文件动态编译为.class文件



类加载器并不需要某个类被“首次主动使用”时再去加载它，JVM规范允许类加载器在预料某个类将要被使用时就预先加载它，如果在预先加载的过程中遇到了.class文件缺失或存在错误，类加载器必须在程序首次主动使用该类时才报告错误



当一个类在初始化时，要求其父类全部都初始化完毕，当一个接口在初始化时，并不要求其父接口都完成了初始化。



在双亲委托机制中，各个加载器按照父子关系形成了树形结构，除了根类加载器之外，其余的类加载器都有且只有一个父加载器



自底向上检查类是否已经加载，自项向下尝试加载类。



启动类加载器：$JAVA_HOME中jre/lib/rt.jar里所有的class，由c++实现，不是classloader的子类；

扩展类加载器：加载java平台中扩展功能的一些jar包，包括$JAVA_HOME中jre/lib/*.jar或-Djava.ext.dirs指定目录下的jar包；

系统类加载器：负责加载classpath中指定的jar包及目录中class；



若有一个类加载器能够成功加载Test类，那么这个类加载器被称为定义类加载器，所有能成功返回Class对象引用的类加载器（包括定义类加载器）都成为初始类加载器。



加载器之间的父子关系实际上是包装关系。



双亲委托机制的有点是能够提高软件系统的安全性。因为在此机制下，用户自定义的类加载器不可能加载应该由父加载器加载的可靠类，从而防止不可靠甚至恶意的代码代替由父加载器的可靠代码。



每个类加载器都有自己的命名空间，命名空间由该加载器及所有父加载器所加载的类组成。



在同一个命名空间中，不会出现类的完整名字（包括类的包名）相同的两个类，在不同的命名空间中，有可能会出出现类的完整名字（包括类的包名）相同的两个类



同一个命名空间内的类是相互可见的。

子加载器的命名空间包含所有父加载器的命名空间。因此由子加载器加载的类能看见父加载器加载的类，由父加载器加载的类不能看见子加载器加载的类

如果两个加载器之间没有直接或间接的父子关系，那么它们各自加载的类相互不可见。



一个类何时结束生命周期，取决于代表它的Class对象何时结束生命周期



由JAVA虚拟机自带的类加载器所加载的类，在虚拟机的生命周期中，始终不会被卸载。



Java语言规范，Java虚拟机规范

**字节码**

1、使用javap -verbose命令分析一个字节码文件时，将会分析该字节码文件的魔数、版本号、常量池、类信息、类的构造方法，类中的方法信息、类变量与成员变量等信息。

2、魔数：所有的.class字节码文件前4个字节都是魔数，魔数值为固定值：oxCAFEBABE,来源：https://blog.csdn.net/renfufei/article/details/69938592

3、魔数之后的4个字节为版本信息，前两个字节表示minor version版本，后两个字节表似乎major version。主版本号为52表示该文件的版本号为1.8.0。可以通过java -version命令来验证这一点。

4、常量池（constant pool）：紧接着主版本号之后的就是常量池入口。一个Java类中定义的很多信息都是由常量池来维护和描述的。可以将常量池看作是class文件的资源仓库，比如Java类中定义的方法与变量信息，都是存储在常量池中。常量池中主要存储两类常量：字面量与符号引用，字面量如文本字符串，Java中声明为final的常量值等，而符号引用如类和接口的全局限定名，字段的名称和描述符，方法的名称和描述符等。

5、常量池的总体结构：Java类所对应的常量池主要由常量池数量与常量池数组这两部分共同构成。常量池数量紧跟在主版本号后面，占据2个字节，常量池数组紧跟在常量池数量之后。常量池数组与一般的数组不同的是，常量池数组中不同的元素的类型、结构都是不同的，长度当然也就不同，但是每一种元素的第一个数据都是一个u1类型，该字节是个标志位，占据1个字节，JVM在解析常量池时，会根据这个u1类型来获取元素的具体类型。值得注意的是，常量池数组中元素的个数=常量池数-1（其中0暂时不使用），目的是为了满足某些常量池索引值在特定情况下需要表达【不引用任何一个常量池】的含义；根本原因在于，索引为0也是一个常量（保留常量），只不过它不位于常量表中，这个常量就对应null值，所以，常量池的索引从1而非0开始。

![img](assets/clipboard.png)

在JVM规范中，每个变量/字段都有描述信息，描述信息主要的作用是描述字段的数据类型、方法的参数列表（包括数量、类型与顺序）与返回值。根据描述符规则，基本数据类型和代表无返回值的void类型都用一个大写字符来表示，对象类型则使用字符L加对象的全限定名称来表示。为了压缩字节码文件的体积，对于基本数据类型，JVM都只使用一个大写字母来表示，如下所示：B-byte，C-char，D-double，F-float，I-int，J-long，S-short，Z-boolean，V-void，L-对象类型，如Ljava/lang/String；

对于数组类型来说，每一个维度使用一个前置的[来表示，如int[]被记录为[I，String[][]，被记录为[[Ljava/lang/String；

用描述符描述方法时，按照先参数列表，后返回值的顺序来描述。参数列表按照参数的严格顺序放在一组()之内，如方法：String getRealnamebyIdaAndNickname(int id,String name)的描述符为：（I，Ljava/lang/String;）Ljava/langString;

`<init>`表示构造方法

<img src="D:/%E6%9C%89%E9%81%93%E4%BA%91/jiyongchaowy@163.com/21f2549ed47442b6889c6197a4c3994c/clipboard.png" alt="img" style="zoom: 67%;" />

深入理解Java字节码结构：https://blog.csdn.net/u011810352/article/details/80316870

```java
ClssFile{ 	u4 				magic; 	u2				minor_version; 	u2				major_version; 	u2				constant_pool_count; 	cp_info			contant_pool[constant_pool_count -1]; 	u2				access_flags; 	u2				this.class; 	u2				super.class; 	u2				interfaces_count; 	u2				interfaces[interfaces_count]; 	u2 				fields_count; 	field_info  	fields[fields_count]; 	u2 				method_count; 	method_info 	methos[method_count]; 	u2				attributes_count; 	attribute_info	attributes[attributes_count]; } 
```

文件结构剖析：https://www.cnblogs.com/luozhiyun/p/10546608.html

Class字节码中有两种数据类型：

1、字节数据直接量：这是基本数据类型。共细分为u1、u2、u4、u8四种，分别代表连续的1个字节、2个字节、4个字节、8个字节组成的整体数据。

2、表（数组）：表是由多个基本数据或其他表，按照既定顺序组成的大的数据集合。表是有结构的，它的结构体现在：组成表的成分所在的位置和顺序都是已经严格定义好的。



Access_Flag访问标志:

访问标志信息包括该Class文件是类还是接口，是否被定位成public，是否是abstract，如果是类，是否被声明为final。

[clipboard.png (1046×658) (gitee.com)](https://gitee.com/ji_yong_chao/blog-img/raw/master/img/clipboard.png)



0x0021：是0x0020和0x0001的并集，表示ACC_PUBLIC与ACC_SUPER的并集



字段表用于描述类和接口中声明的变量。这里的字段包含了类级别变量以及实例变量，但是不包括方法内部声明的局部变量。



filed_count: u2

![img](assets/clipboard.png)



field_info{ 	u2 				access_flags; 0002 	u2 				name_index;  0005 	u2				descriptor_index; 0006 	u2				attributes_count;	0000 	attribute_info	attributes[attributes_count]; } 



java反编译工具：http://java-decompiler.github.io/



![img](assets/clipboard.png)



method_info{ 	u2					access_flags; 	u2 					name_index; 	u2					descriptor_index; 	u2					attributes_count; 	attribute_info		attributes[attributes_count]; } 

方法中的每个属性都是一个attribute_info结构：

attribute_info{ 	u2 	attribute_name_index; 	u4	attribute_length; 	u1	info[attribute_length]; } 



JVM预定义了部分attribute，但是编译器自己也可以实现自己的attribute写入class文件里，供运行时使用。

不同的attribute通过attribute_name_index来区分



Code attribute的作用是保存该方法的结构，如所对应的字节码：

Code_attribute{ 	u2	attribute_name_index;  //属性名 	u4	attribute_length; 	u2	max_stack; 	u2	max_locals; 	u4	code_length; 	u1	code[code_length]; 	u2	exception_table_length; // 异常表长度 	{ 		u2	start_pc; 		u2	end_pc; 		u2	handler_pc; 		u2	catch_type; 	}	exception_table[exception_table_length]; 	u2	attribute_count; 	attribute_info attributes[attribute_count]; } 

attribute_length表示attribute所包含的字节数，不包含attribute_name_index和attribute_length字段；

max_stack表示这个方法进行的任何时刻所能达到的操作数栈的最大深度；

max_locals表示方法执行期间创建的局部变量的数目，包含用来表示传入的参数的局部变量；

code_length表示该方法所包含的字节码的字节数及具体的指令码；

code表示具体字节码，即是该方法被调用时，虚拟机所执行的字节码；

exception_table，这里存放的是处理异常的信息；

每个exception_table表项由start_pc，end_pc，handler_pc，catch_type组成；

start_pc和end_pc表示在code数组中的从start_pc到end_pc处（包含start_pc，不包含end_pc）的指令抛出的异常会由这个表项来处理； handler_pc表示处理异常的代码的开始处。catch_type表示会被处理的异常类型，它指向常量池的一个异常类。当catch_type为0时，表示处理所有的异常；



LineNumberTable：这个属性用来表示code数组中的字节码和java代码行数之间的关系。这个属性可以用来在调试的时候定位代码执行的行数：

lineNumberTable_attribute{ 	u2 attribute_name_index; 	u4	attribute_length; 	u2	line_number_table_length; 	{ 		u2 start_pc 		u2	line_number; 	}line_number_table[line_number_table_length]; } 



jclasslib查看工具

javap -verbose -p ...

java字节码对于异常的处理方式：

1、统一采用异常表的方式来对异常进行处理

2、在jdk1.4.2之前的版本中，并不是使用异常表的方式来对异常进行处理的，而是采用特定的指令的方式

3、当异常处理存在finally语句块时，现在化的JVM采取处理方式时将finally语句块的字节码拼接到每一个catch块后面。换句话说，程序中存在多少个catch块后面重复多少个finally语句块的字节码。



栈帧（stack frame）:栈帧是一种用于帮助虚拟机执行方法调用与方法执行的数据结构。栈帧本身是一种数据结构，封装了方法的局部变量表，动态链接信息，方法的返回地址以及操作数栈等信息。



Java中有两种引用方式：符号引用，直接引用

类加载或者首次使用，符号引用--->直接引用

![img](assets/clipboard.png)

栈帧：https://www.cnblogs.com/jhxxb/p/11001238.html

有些符号引用时在类加载阶段或是第一次使用时就会转换为直接引用，这种转换叫做静态解析；另外一些符号引用则是在每次运行期转换为直接引用，这种转换叫做动态链接，这体现为Java的多态性。

Animal a = new Cat(); a.sleep a = new Dog() a.sleep a = new Tiger() a.sleep 

在程序编译期间，实际上调用的是Animal的sleep方法，执行期间会通过invokevirtual来检查真正的方法的指向。



JVM助记符：

1、invokeinterface：调用接口中的方法，实际上是在运行期决定的，决定到底调用实现该接口中的哪个对象的特定的方法；

2、invokestatic：调用静态方法；

3、invokespecial：调用自己的私有方法、构造方法（`<init>`）以及父类的方法；

4、invokevirtual：调用虚方法，运行期间动态查找的过程；

5、invokedynamic：动态调用方法。



静态解析的四种情形：

1、静态方法

2、父类方法

3、构造方法

4、私有方法（无法被重写）



以上四类方法称为非虚方法，他们是在类加载阶段就可以将符号引用换转为直接直接引用，这种情形就被称之为静态解析。



方法的静态分派：

Grandpa g1 = new Father(); 

以上代码，g1的静态类型是Grandpa，而g1的实际类型（真正指向的类型）是Father。



结论：变量的静态类型是不会发生变化的，而变量的实际类型则是可以发生变化的（多态的一种体现）,实际类型是在运行期可确定。



方法重载对于JVM来讲是一种静态的行为，因此调用重载方法，变量类型是根据传入变量的静态类型来确定的。方法重载在编译期就可以完全确定的。



方法的动态分派：方法接收者指的是这个方法到底是由哪一个对象来的调用的，invokevirtual字节码指令的多态查找流程，在运行期间，首先找到操作数栈顶的第一个元素所指向的真正的类型，然后在实际的类型当中寻找到特定的方法，如果能找到，那就将符号引用转换为直接引用，如果找不到，就开始按照继承体系，在父类里面开始从下网上开始寻找，可以找到就转换为直接引用，如果没有找到，则抛出异常。



方法重载和方法重写的结论：方法重载是静态的，是编译期行为；方法重写是动态的，是运行期行为。



针对于方法调用的动态分派的过程，虚拟机在类的方法区简历一个虚方法表的数据结构（virtual method table，vtable）

针对于invokeinterface指令来说，虚拟机会建立一个接口方法表的数据结构（interface method table，itable）



编译执行，解释执行

现在JVM在执行java代码的时候，通常都会将解释执行与编译执行二者结合来进行。

所谓解释执行，就是通过解释器来读取字节码，遇到相应的指令就去执行该指令；

所谓编译执行，是通过即时编译器（Just In Time，JIT）将字节码转换为本地机器码来执行，现在JVM会根据代码热点来生成响应的本地机器码。



基于栈的指令集（内存当中执行），基于寄存器的指令集（CPU当中执行）的关系：

1、JVM执行指令时所采取的方式是基于栈的指令集；

2、基于栈的指令集主要的操作有入栈与出栈两种；

3、基于栈的指令集的优势在于它可以在不同平台之间一直，而基于寄存器的指令集是与硬件架构关联的，无法做到可移植；

4、基于栈的指令集的缺点在于完成相同的操作，指令数量通常要比基于寄存器的指令集数量要多；基于栈的指令集是在内存中完成操作的，而基于寄存器的指令集是直接由CPU来执行的，它是在高速缓冲区中进行执行的，速度要快很多。虽然虚拟机以采用一些优化手段，但总体来说，基于栈的指令集的执行速度要慢一些。



unsigned byte: 0-255



构造代理对象的类：proxyClassFactory



通过字节码分析JDK8中Lambda表达式编译及执行机制：https://blog.csdn.net/lijingyao8206/article/details/51225839

# 内存模型

![img](assets/clipboard.png)



Java虚拟机栈：存储对象的引用，属于线程私有的内存空间，伴随着线程的生命周期；局部变量表中可以存储基本数据类型以及引用类型，每个方法执行的时候都会创建一个栈帧，栈用于存放局部变量表，操作栈，动态链接，方法出口等信息，一个方法的执行过程，就是这个方法对于栈帧的入栈、出栈过程；

Stack Frame 栈帧：

程序计数器（Program Counter）：用来标识当前执行线程的行号/顺序，也是线程所私有的内存空间；

本地方法栈（Native Method Stack）：主要用于处理本地方法，有的虚拟机实现会把本地方法栈和虚拟机栈合二为一，例如hostpot虚拟机；

堆（Heap）：存储真实的对象，JVM管理的最大的一块内存空间；堆空间的内存可以是连续的，也可以是不连续的，与堆相关的一个重要概念是垃圾收集器，现代几乎所有的垃圾收集器都是采用的分代收集算法，所以堆空间也基于这一点进行了相应的划分：新生代与老年代；Eden空间（80%），From Survivor空间（10%）与To Survivor空间（10%）。

方法区（Method Area）：存储元信息。永久代（Permanent Generation），从JDK1.8开始，已经彻底废弃了永久代，使用元空间（meta space），方法区里面的元信息是很少会被回收的，实例数据和元数据，元数据（Class对象）位于方法区；

运行时常量池：方法区的一部分内容。

直接内存：Direct Memory，并非由Java虚拟机管理的内存区域，与Java NIO密切相关，JVM是通过DirectByteBuffer来操作直接内存的。



关于Java对象创建的过程：

new关键字创建对象的3个步骤：

1、在推内存中创建出对象的实例；

2、为对象的成员变量赋初值；

3、将对象的引用返回；



分配内存的策略：

指针碰撞（前提是堆中的空间通过一个指针进行分割，一侧是已经被占用的空间，另一侧是未被占用的空间）

空闲列表（前提是堆内存空间中已使用与未被使用的空间是交织在一起的，这时，虚拟机就需要通过一个列表来记录哪些空间是可以使用的，哪些空间是未被使用的，接下来找出可以容纳下新创建对象的且未被使用的空间，在此空间存放该对象，同时还要修改列表上的记录）



对象在内存中的布局：

1、对象头

2、实例数据（即我们在一个类中所声明的各项信息）

3、对齐填充（可选）



引用访问对象的方式：

1、使用句柄的方式； 

2、使用直接指针的方式。



可视化工具：

jvisualvm

jconsole

System.gc(); 

OOM，全称“Out Of Memory”

-Xms5m -Xmx5m -xx:+HeapDumpOnOutOfMemoryError 



虚拟机栈溢出：一直递归

参数设置：

-Xss160k 

 	

元空间大小设置：

-XX:MaxMetaspaceSize=10m -XX:+TraceClassLoading 

Java永久代去哪儿了：https://www.infoq.cn/article/Java-PERMGEN-Removed/



获取java进程：

ps -ef | grep java jps -mlvV jps -l 

 

打印类加载器数据命令：

jmap -clstats PID  // cl表示classloader 



 $ jmap -clstats   Attaching to process ID 6476, please wait...  Debugger attached successfully.  Server compiler detected.  JVM version is 25.5-b02  finding class loader instances ..done.  computing per loader stat ..done.  please wait.. computing liveness.liveness analysis may be inaccurate ...  class_loader classes      bytes parent_loader     alive? type          655  1222734     null      live     0x000000074004a6c0    0    0    0x000000074004a708    dead      java/util/ResourceBundle$RBClassLoader@0x00000007c0053e20  0x000000074004a760    0    0      null      dead      sun/misc/Launcher$ExtClassLoader@0x00000007c002d248  0x00000007401189c8     1     1471 0x00000007400752f8    dead      sun/reflect/DelegatingClassLoader@0x00000007c0009870  0x000000074004a708    116   316053    0x000000074004a760   dead      sun/misc/Launcher$AppClassLoader@0x00000007c0038190  0x00000007400752f8    538  773854    0x000000074004a708   dead      org/dacapo/harness/DacapoClassLoader@0x00000007c00638b0  total = 6      1310   2314112           N/A       alive=1, dead=5     N/A   

打印堆内存命令：

jmap -heap PID 

 

打印元空间的信息：

jstat -gc LVMID 



![img](assets/clipboard.png)

jcmd是从jdk1.7开始增加的命令，可以用来查看进程的JVM启动参数：

jcmd PID VM.flags 

当前运行java进程可以执行的操作列表：

jcmd PID help 

查看具体命令的选项：

jcmd PID help JFR.dump 

查看JVM性能相关的参数：

jcmd PID PerfCounter.print 

查看JVM启动的时长：

jcmd PID VM.uptime 

查看系统中的类的统计信息：

jcmd PID GC.class_histogram 

查看当前线程的堆栈信息：

jcmd PID Thread.print 

导出Head dump 文件，导出的文件可以通过jvisualvm查看：

jcmd PID GC.head_dump file_name 

查看JVM的属性信息：

jcmd PID VM.system_properties 

查看JVM启动命令行的参数：

jcmd PID VM.command_line 

jstack：可以查看或是导出Java应用程序中的堆栈信息

jmc：Java Mission Control

jfr：Java Flight Recorder 实时到统计数据

OQL：JVM 对象查询语言

jhat file_name 

# 垃圾回收

https://www.cnblogs.com/andy-zhou/p/5327288.html

垃圾判断算法

GC算法

垃圾回收器的实现和选择



引用计数算法（Refence Counting）

给对象添加一个引用计数器，当有一个地方引用它，计数器加1，当引用失效，计数器减1，任何时刻计数器为0的对象就是不可能再被使用的；

引用计数算法无法解决对象循环引用的问题；

对象循环引用：A引用B，B引用A，当A和B都是孤立的时候，这两个对象的计数器都是1，无法进行回收，但实际上已经没有作用了。



根搜索算法（Root Tracing）

通过一系列的称为“GC Roots”的点作为起始进行向下搜索，当一个对象到GC Roots没有任何引用链（Reference Chain）相连，则证明此对象是不可用的；



在Java语言中，GC Roots包括：

1. 在VM栈（栈帧中的本地变量）中的引用
2. 方法区中的静态引用
3. JNI（即一半说的Nactive方法）中的引用



方法区的GC主要回收两部分内容：废弃常量与常用类



类回收需要满足3个条件：

1. 该类所有的实例都已经被GC，也就是JVM中不存在改Class的任何实例；
2. 加载该类的ClassLoader已经被GC；
3. 该类对应的java.lang.Class对象没有在任何地方被引用，如不能在任何地方通过反射访问该类的方法。



JVM常见的GC算法：

- 标记-清除算法（Mark-Sweep）
- 标记-整理算法（Mark-Compact）
- 复制算法（Copying）
- 分代算法（Generational）



Mark-Sweep

算法分为“标记”和“清除”两个阶段，首先标记出所有需要回收的对象，然后回收所有需要回收的对象。

缺点：

1、效率问题，标记和清理两个过程效率都不高，需要扫描所有对象，堆越大，GC越慢；

2、空间问题，标记清理之后会产生大量不连续的内存碎片，空间碎片太多可能导致后续使用中无法找到足够的连续内存而提前触发另一次的垃圾搜集动作。



Mark-Compact

标记过程仍然一样，但后续步骤不是进行直接清理，而是令所有存活的对象一端移动，然后直接清理掉这端边界以外的内存。

没有内存碎片，但是需要耗费更多的时间进行Compact



Copying

将可用内存划分为两块，每次只使用其中的一块，当半区内存用完之后，仅将还存活的对象复制到另一块上面，然后就把原来整块内存空间一次性清理掉。

优点：

这样使得每次内存回收都是对整个搬去的回收，内存分配时也就不用考虑内存碎片等复杂情况，只要移动过堆顶指针，按顺序分配内存就可以了，实现简单，运行高效。

缺点：

这种算法的代价是将内存缩小为原来的一半，代价高昂

现在的虚拟机中都是采用此算法来回收新生代；

将内存分为一块较大的eden空间和两块较少的survivor空间，每次使用eden和其中一块survivor，当回收的时候会将eden和survivor还存活的对象一次性拷贝到另一块survivor空间上，然后清理掉eden和用过的survivor，用过的survivor称为From survivor，没有用过的survivor称为To survivor。

eden和survivor的大小比例是8:1，也就是每次只有10%的内存是“浪费”的。

复制收集算法在对象存活率高的时候，效率有所下降；

如果不想浪费50%的空间，就需要有额外的空间进行分配担保用于应付半区内存中所有对象都100%存活的极端情况，所以在老年代一般不能直接选用这种算法。



特点：

- 只需要扫描存活的对象，效率更高
- 不会产生脆片
- 需要浪费额外的内存作为复制区
- 复制算法非常适合生命周期比较短的对象，因为每次GC总能回收大部分的对象，复制的开销比较小
- 根据IBM的专门研究，98%的Java对象只会存活1个GC周期，对这些对象很适合用复制算法。而且不用1：1的划分工作区和复制区的空间



Generational Collecting

针对不同生命周期的对象采用不同的GC算法。

根据不同的存活周期将内存划分为几块。一半将Java堆分作新生代和老年代，这样就可以根据各个年代的特点采用最适当的收集算法譬如新生代每次GC都有大批对象死去，只有少量存活，那么就可以选用复制算法只需要付出少量存活对象的复制成本就可以完成收集。



JVM6中划分为三个代：年轻代，老年代和永久代



年轻代：

通过Copying算法



老年代：

存放了经过一次或多次GC还存活的对象；

一般采用Mark-Sweep或者Mark-Compact算法进行GC



HotSpot将引用分为四种：Strong（强引用）、Soft（软引用）、Weak（弱引用）、Phantom（虚引用）

1、Strong即默认通过Object o = new Object()这种方式赋值的引用

2、Soft、Weak、Phantom这三种则都是继承Reference



Soft：没存不够时一定会被GC，长期不用也会被GC

Weak：一定会被GC，当被mark为dead，会在RefenceQueue中通知

Phantom：本来就没引用，当从JVM heap中释放时会通知



GC在分代模型的基础上，从时机上分为两种Scavenge GC和Full GC

Scavenge GC（Minor GC）

触发时机：新对象生成时，Eden空间满了

理论上Eden区大多数对象会在Scavenge GC回收，复制算法的执行效率会很高，Scavenge GC时间比较短。

Full GC

对整个JVM进行整理，包括Young、Old和Perm

主要的触发时机：1、Old满了 2、Perm满了 3、System.gc()

效率很低，需要避免Full GC。



并行（Parallel）：指多个收集器的线程同时工作，但是用户线程处于等待状态

并发（Concurrent）：指收集器在工作的同时，可以允许用户线程工作。

并发不代表解决了GC停顿的问题，在关键的步骤还是要停顿。比如在收集器标记垃圾的时候要停顿，但在清楚垃圾的时候，用户线程可以和GC线程并发执行。



![img](assets/clipboard.png)

Serial收集器

单线程收集器，收集时会暂停所有工作线程（Stop The World，简称STW），使用复制收集算法，虚拟机运行在Clint模式时的默认新生代收集器。

特点：

- 最早的收集器，单线程进行GC
- New和Old Generation都可以使用
- 在新生代，采用复制算法；在老年代，采用Mark-Compact算法
- 因为是单线程GC，没有多线程切换的额外开销，简单使用。
- Hotspot Client模式缺省的收集器



ParNew收集器

ParNew收集器就是Serial的多线程版本，除了使用多个收集线程外，其余行为包括算法，STW，对象分配规则，回收策略等都与Serial收集器一摸一样。

对应这种收集器是虚拟机运行在Server模式的默认新生代收集器，在单CPU的环境中，ParNew收集器并不会比Serila收集器有更好的效果

特点：

- 使用复制算法
- 只有在多CPU的环境下，效率才会比Serial收集器高
- 可以通过-XX:ParallerlGCThreads来控制GC线程数的多少，需要结合具体的CPU的个数



Parallel Scavenge收集器

也是一个多线程收集器，也是使用复制算法，但它的对象分配规则与回收策略都ParNew收集器有所不同，它是以吞吐量最大化（即GC时间占总运行时间最小）为目标的收集器实现，它允许较长时间的STW换取总吞吐量最大化。



Serial Old收集器

Serial Old是单线程收集器，使用标记一整理算法，是老年代的收集器



Parallel Old收集器

老年代版本吞吐量优化收集器，使用多线程和标记-整理算法，JVM1.6提供，在此之前，新生代使用了PS收集器的话，老年代除了Serial Old别无选择，因为PS无法与CMS收集器配合工作。

特点：

- Parallerl Scavenge + Parallel Old = 高吞吐量，但GC停顿可能不理想



CMS收集器

CMS是一种以最短停顿时间为目标的收集器，使用CMS并不能达到GC效率最高（总体GC时间最小），但它能尽可能降低GC时服务的停顿时间，CMS收集器使用的是标记-清楚算法

特点:

- 只针对于追求最短停顿时间，非常适合web应用
- 只针对老年去，一般结合ParNew使用
- Concurrent，GC线程和用户线程并发工作（尽量并发）
- Mark-Sweep
- 只有在多CPU环境下才有意义
- 使用-XX:+UseConcMarkSweepGC打开
- CMS以牺牲CPU资源的代价来减少用户线程的停顿。当CPU个数少于4的时候，有可能对吞吐量影响非常大
- CMS在并发清理的过程中 ，用户线程还在跑。这时候需要预留一部分空间给用户线程
- CMS用Mark-Sweep，会带来碎片问题。碎片过多的时候会容易频繁触发Full GC



Java内存泄漏的经典原因：

1. 对象定义在错误的范围（Wrong Scope）
2. 异常（Exception）处理不当
3. 集合数据管理不当（1、当使用基于数组的数据结构的时候，使用合适的初始值，减少resize的过程 2、如果List只需要顺序访问，不需要随机访问的话，使用LinkedList代替ArrayList）



虚拟机参数设置：

-verbose:gc   // 表示输出详细的垃圾回收的日志 -Xms20M       // 堆内存初始大小 -Xmx20M       // 堆内存最大值 -Xmn10M       // 新生代大小是10m -XX:+PrintGCDetails     // 打印GC详细信息 -XX:SurvivorRatio=8    // 8:1 -XX:PretenureSizeThreshold=4194304   // 新生代创建对象的阈值大小，单位为字节，只有串行收集器才会生效 -XX:+UseSerialGC -XX:MaxTenuringThreshold  // 在可以自动调节对象晋升（Promote）到老年代阈值的GC中，设置该阈值的最大值 -XX:PrintTenuringDistribution 



当新生代无法容纳待创建对象的时候，会在老年代分配内存



JDK1.8使用的默认垃圾收集器：

PSYoungGen：Parallel Scavenge（新生代垃圾收集器）

ParOldGen：parallel Old（老年代垃圾收集器）

查看java虚拟机启动参数：

java -XX:+PrintCommandLineFlags -version 

执行结果：

-XX:InitialHeapSize=120400640 -XX:MaxHeapSize=1926410240 -XX:+PrintCommandLi neFlags -XX:+UseCompressedClassPointers -XX:+UseCompressedOops -XX:-UseLarge PagesIndividualAllocation -XX:+UseParallelGC（使用的垃圾收集器策略，这里使用并行 的垃圾收集器） java version "1.8.0_212" Java(TM) SE Runtime Environment (build 1.8.0_212-b10) Java HotSpot(TM) 64-Bit Server VM (build 25.212-b10, mixed mode) 



PretenureSizeThreshold：设置对象超过多大的时候直接在老年代进行分配

MaxTenuringThreshold：CMS中默认值为6，G1中默认值为15（该数值是由4个bit来表示的，所以最大值1111，即15）

经历了多次GC后，存活的对象会在From Survivor与To Survivor之间来回存放，而这里面的一个前提则是这两个空间由足够的大小来存放这些数据，在GC算法中，会计算每个对象年龄的大小，如果达到某个年龄后发现总大小已经大于了Survivor空间的50%，那么这时候就需要调整阈值，不能再继续等到默认的15次GC后才开始晋升，因为这样会导致Survivor空间不足，所以需要调整阈值，让这些存活对象尽快完成晋升。



枚举根节点

当执行系统停顿下来后，并不需要一个不露地检查完所有执行上下文和全局的引用位置，虚拟机应该当是有办法直接得知哪些地方存放着对象引用。再HotSpot的实现中，是使用一组称为OopMap的数据结构来达到这个目的的。



安全点

在OopMap的协助下，HotSpot可以快速且准确地完成GC Roots枚举，但一个很现实的问题随之而来：可能导致引用关系变化，或者说OopMap内容变化的指令非常多，如果为每一条指令都生成对应的OopMap，那将会需要大量的额外空间，这样GC的空间成本将会变得更高；

实际上，HotSpot并没有为每条指令都生成OopMap，而只是在“特定的位置”记录了这些信息，这些位置称为安全点，即程序执行时并非在所有地方都能停顿下来开始GC，只有在达到安全点时才能暂停；

安全点的选定既不能太少以至于让GC等待时间太长，也不能过于频繁以至于过分增大运行时的负载，所以，安全点的选定基本上是以“是否具有让程序长时间执行的特征”为标准进行选定的——因为每条指令执行的时间非常短暂，程序不太可能因为指令流长度太长这个原因而过长时间运行，“长时间执行”的最明显的特征就是指令序列复用，例如方法调用、循环跳转、异常跳转等，所以具有这些功能的指令才会产生安全点；

对于安全点，另一个需要考虑的问题就是如何让在GC发生时让所有线程（这里不包括执行JNI调用的线程）都“跑”到最近的安全点上再停顿下来：抢占式中断（Preemptive Suspension）和主动式中断（Voluntary Suspension）。

抢占式中断：它不需要线程的执行代码主动去配合，在GC发生时，首先把所有线程全部中断，如果有线程中断的地方不在安全点上，就恢复线程，让它执行到安全点上，再进行中断。

主动式中断：当GC需要中断线程的时候，不直接对线程操作，仅仅简单的设置一个标志，各个线程执行时主动去轮询这个标志，发现中断标志为真时就自己中断挂起。轮询标志的地方和安全点是重合的，另外再加上创建对象需要分配内存的地方。

现在几乎没有虚拟机采用抢占式中断来暂停线程从而相应GC事件。



安全区域

在使用安全点似乎已经完美解决了如何进入GC的问题，但实际情况却并不一定，安全点机制保证了程序执行时，在不太长的时间内就会遇到可进入GC的安全点，但如果程序在“不执行”的时候呢？所谓程序不执行就是没有分配CPU时间，典型的例子就是处于Sleep状态或者Blocked状态，这时候线程无法响应JVM的中断请求，JVM也显然不太可能等待线程重新弄分配CPU时间，对于这种情况，就需要安全区域（Safe Region）来解决了。

在线程执行到安全区域中的代码时，首先标识自己已经进入了安全区域，那样，当在这段时间里JVM要发去GC时，就不用管标识自己为安全区域状态的线程了。在线程要离开安全区域时，它要检查系统是否已经完成了根节点枚举（或者是整个GC过程），如果完成了，那线程就继续执行，否则它就必须等待知道收到可以安全离开安全区域的信号为止。



CMS（Concurrent Mark Sweep）收集器，以获取最短回收停顿时间（STW）为目标，多数应用于互联网站或者B/S系统的服务器端上，

CMS垃圾回收器详解：https://blog.csdn.net/zqz_zqz/article/details/70568819



CMS是基于“标记-清除“算法实现的，整个过程分为4个步骤：

1. 初始标记（CMS initial mark）
2. 并发标记（CMS concurrent mark）
3. 重新标记（CMS remark）
4. 并发清除（CMS concurrent sweep）



其中，初始标记和重新标记步骤仍然需要STW，初始标记只是标记一下GC Roots能直接关联到的对象，速度很快；

并发标记阶段就是进行GC Roots Tracing的过程；

重新标记阶段则是为了修正并发标记期间因用户程序继续运作而导致标记产生变动的那一部分对象的标记记录，这个阶段的挺短时间一般会比初始标记阶段稍长一些，但远比并发标记的时间短。



在整个过程中耗时最长的并发标记和并发清理的过程收集器线程都可以与用户线程一起工作，因此，从总体上看，CMS收集器的内存回收过程是与用户线程一起并发执行的。

![img](assets/clipboard.png)



优点：

并发收集、低停顿



缺点：

- CMS收集器对CPU资源非常敏感
- CMS收集器无法处理浮动垃圾（Floating Garbage），可能出现”Concurrent Mode Failure“失败而导致另一次Full GC的产生 。如果在应用中老年代增长不是太快，可以适当调高参数-XX:CMSInitiatingOccupanyFraction的值来提高触发百分比，以便降低内存回收次数从而获取更好的性能，要是CMS运行期间预留的内存无法满足程序需要时，虚拟机将启动后备预案：临时启动Serial Old收集器来重新进行老年代的来及手机，这样停顿时间就很长了。所以说参数-XX:CMSInitiatingOccupancyFraction设置得太高了很容易导致大量”Concurrent Mode Failure“失败。性能反而降低。
- 收集结束时会有大量空间碎片产生，空间碎片过多时，将会给大对象分配带来很大麻烦，往往出现老年代还有很大空间剩余，但是无法找到足够大的连续空间来分配当前对象，不得不提前进行一个Full GC。CMS收集器提供了一个-XX:+UseCMSCompactAtFullCollection开关参数（默认开启），用于在CMS收集器顶不住要进行Full GC时开启内存碎片的合并整理过程，内存整理的过程是无法并发的，空间碎片问题没有了，但停顿时间不得不变长。



空间分配担保

在发生Minor GC之前，虚拟机会先检查老年代最大可用的连续空间是否大于新生代所有对象总空间，如果这个条件成立，那么Minor GC可以确保是安全的。当大量对象在Minor GC后仍然存活，就需要老年代进行空间分配担保，把Survivor无法容纳的对象直接进入老年代。如果老年代判断到剩余空间不足（根据以往每一次回收晋升到老年代对象容量的平均值作为经验值），则进行一次Full GC。



CMS更详细的步骤：

1.  初始标记(CMS-initial-mark) ,会导致swt；
2.  并发标记(CMS-concurrent-mark)，与用户线程同时运行；
3.  预清理（CMS-concurrent-preclean），与用户线程同时运行；
4.  可被终止的预清理（CMS-concurrent-abortable-preclean） 与用户线程同时运行；
5. 重新标记(CMS-final remark) ，会导致swt；
6.  并发清除(CMS-concurrent-sweep)，与用户线程同时运行；
7. 并发重置状态等待下次CMS的触发(CMS-concurrent-reset)，与用户线程同时运行；

初始标记

\1. 标记老年代中所有的GC Roots对象，如下图节点1；

\2. 标记年轻代中活着的对象引用到的老年代的对象（指的是年轻带中还存活的引用类型对象，引用指向老年代中的对象）如下图节点2、3；

![img](assets/clipboard.png)



并发标记

从“初始标记”阶段标记的对象开始找出所有存活的对象;

为是并发运行的，在运行期间会发生新生代的对象晋升到老年代、或者是直接在老年代分配对象、或者更新老年代对象的引用关系等等，对于这些对象，都是需要进行重新标记的，否则有些对象就会被遗漏，发生漏标的情况。为了提高重新标记的效率，该阶段会把上述对象所在的Card标识为Dirty，后续只需扫描这些Dirty Card的对象，避免扫描整个老年代；

并发标记阶段只负责将引用发生改变的Card标记为Dirty状态，不负责处理；

如下图所示，也就是节点1、2、3，最终找到了节点4和5。并发标记的特点是和应用程序线程同时运行。并不是老年代的所有存活对象都会被标记，因为标记的同时应用程序会改变一些对象的引用等。

![img](assets/clipboard.png)



预清理阶段

前一个阶段已经说明，不能标记出老年代全部的存活对象，是因为标记的同时应用程序会改变一些对象引用，这个阶段就是用来处理前一个阶段因为引用关系改变导致没有标记到的存活对象的，它会扫描所有标记为Direty的Card

如下图所示，在并发清理阶段，节点3的引用指向了6；则会把节点3的card标记为Dirty；

![img](assets/clipboard.png)

最后将6标记为存活,如下图所示：

![img](assets/clipboard.png)

可终止的预处理

这个阶段尝试着去承担下一个阶段Final Remark（STW）阶段足够多的工作。这个阶段持续的时间依赖好多的因素，由于这个阶段是重复的做相同的事情直到发生aboart的条件（比如：重复的次数、多少量的工作、持续的时间等等）之一才会停止。

ps:此阶段最大持续时间为5秒，之所以可以持续5秒，另外一个原因也是为了期待这5秒内能够发生一次ygc，清理年轻代的引用，是的下个阶段的重新标记阶段，扫描年轻带指向老年代的引用的时间减少；



重新标记

这个阶段会导致第二次stop the word，该阶段的任务是完成标记整个年老代的所有的存活对象。

这个阶段，重新标记的内存范围是整个堆，包含_young_gen和_old_gen。为什么要扫描新生代呢，因为对于老年代中的对象，如果被新生代中的对象引用，那么就会被视为存活对象，即使新生代的对象已经不可达了，也会使用这些不可达的对象当做cms的“gc root”，来扫描老年代； 因此对于老年代来说，引用了老年代中对象的新生代的对象，也会被老年代视作“GC ROOTS”:当此阶段耗时较长的时候，可以加入参数-XX:+CMSScavengeBeforeRemark，在重新标记之前，先执行一次ygc，回收掉年轻带的对象无用的对象，并将对象放入幸存带或晋升到老年代，这样再进行年轻带扫描时，只需要扫描幸存区的对象即可，一般幸存带非常小，这大大减少了扫描时间

由于之前的预处理阶段是与用户线程并发执行的，这时候可能年轻带的对象对老年代的引用已经发生了很多改变，这个时候，remark阶段要花很多时间处理这些改变，会导致很长stop the word，所以通常CMS尽量运行Final Remark阶段在年轻代是足够干净的时候。

另外，还可以开启并行收集：-XX:+CMSParallelRemarkEnabled



并发清理

通过以上5个阶段的标记，老年代所有存活的对象已经被标记并且现在要通过Garbage Collector采用清扫的方式回收那些不能用的对象了。

这个阶段主要是清除那些没有标记的对象并且回收空间；

由于CMS并发清理阶段用户线程还在运行着，伴随程序运行自然就还会有新的垃圾不断产生，这一部分垃圾出现在标记过程之后，CMS无法在当次收集中处理掉它们，只好留待下一次GC时再清理掉。这一部分垃圾就称为“浮动垃圾”。



并发重置

这个阶段并发执行，重新设置CMS算法内部的数据结构，准备下一个CMS生命周期的使用。



CMS将大量工作分散到并发处理阶段来减少STW时间。



吞吐量关注的是，在一个指定的时间内，最大化一个应用的工作量。

衡量一个系统吞吐量的好坏：

- 在一个小时内同一个事务（或者任务、请求）完成的次数（tps）
- 数据库一小时可以完成多少次查询

对于关注吞吐量的系统，卡顿是可以接收的，因为这个系统关注长时间的大量任务的执行能力，单次快速的响应并不值得考虑。

响应能力：

响应能力指的是一个程序或者系统对请求是否能够及时响应，比如：

- 一个桌面UI能多快地影响一个时间
- 一个网站能够多块返回一个页面请求
- 数据库能够多快返回查询的数据

对于这类对响应能力敏感的场景，长时间的停顿是无法接收的。 



G1收集器是一个面向服务端的垃圾收集器，适用于多核处理器、大内存容量的服务端系统。满足短时间GC停顿的同时达到一个较高的吞吐量。



G1官方文档：https://www.oracle.com/technetwork/tutorials/tutorials-1876574.html



G1收集器的设计目标

- 与引用线程同时工作，几乎不需要STW
- 整理剩余空间，不产生内存碎片（CMS只能在Full GC时，用STW整理内存碎片）
- GC停顿更加可控
- 不牺牲系统的吞吐量
- GC不要求额外的内存空间（CMS需要预留空间存储浮动垃圾）



heap被划分为一个个相等的不连续的内存区域（regions），每个region都有一个分代的角色：eden、survivor、old

对每个角色的数量并没有强制的限定，也就是说对每种分代内存的大小，可以动态变化

G1最大的特点就是高效的执行回收，优先去执行那些大量对象可回收的区域（region）



G1使用了gc停顿可预测的模型，来满足用户设定的gc停顿时间，根据用户设定的目标时间，G1会自动地选择哪些region要清除，一次清除多少个region

G1从多个region中复制存活的对象，然后集中放入一个region中，同时整理、清除内存（Copying收集算法）

特点：G1使用的copying算法不会造成内存碎片，并且只是针对特定的region进行整理，因此不会导致gc停顿的时间过长。



G1并非一个实时的收集器，与PS一样，对gc停顿时间的设置并不是绝对生效，只是G1有较高的几率保证不超过设定的gc停顿时间。与之前的gc收集器对比，G1会根据用户设定的gc停顿时间，只能评估哪几个region需要被回收可以满足用户的设定。



G1将整个堆分成了相同大小的分区（Region）：

每个分区都可能是年轻代也可能是老年代，但是在同一时刻只能属于某个代。年轻代、幸存区、老年代这些概念还存在，成为逻辑上的概念，这样方便复用之前分代框架的逻辑。

在物理上不需要连续，则带来了额外的好处——有的分区内垃圾对象也别多，有的分区内垃圾对象很少，G1会优先回收垃圾对象特别多的分区，这样可以花费较少的时间来回收这些分区的垃圾，这也就是G1名字的由来，即首先收集垃圾最多的分区。

![img](assets/clipboard.png)



依然是在新生代满了的时候，对整个新生代进行回收——整个新生代中的对象，要么被回收，要么晋升，至于新生代也采取分区机制的原因，则是因为这样跟老年代的策略统一，方便调整代的大小。



G1还是一种带压缩的收集器，在回收老年代的分区时，是将存活的对象从一个分区拷贝到另一个可用分区，这个拷贝的过程就实现了局部的压缩。



收集集合（CSet）：一组可被回收的分区的集合。在CSet中存活的数据会在GC过程中被移动到另一个可用分区，CSet中的分区可以来自eden空间、survivor空间或者老年代。



已记忆集合（RSet）：Rset记录了其他Region中的对象引用本Region中对象的关系，属于points-into结构（谁引用了我的对象），RSet的价值在于使得垃圾收集器不需要扫描整个堆到谁引用了当前分区中的对象，只需要扫描RSet即可。



G1 GC是在points-out的card table之上再加了一层结构来构成points-into RSet：每个region会记录下到底哪些别的region有指向自己的指针，而这些指针分别在哪些card的范围内；



RSet其实是一个hash table，key是别的region的其实地址，value是一个集合，里面的元素是card table和index。举例来说，如果region A的RSet里面有以想的key是region B，value里有index为1234的card，它的意思就是region B的一个card里有引用指向region A。所以堆region A来说，该RSet记录的是points-into的关系；而card table仍然记录了points-out的关系。





SATB（Snapshot-At-The-Begining）:是G1在并发标记阶段使用的增量式的标记算法；

并发标记式并发多线程的，但并发线程在同一时刻只扫描一个分区；



![img](assets/clipboard.png)





![img](assets/clipboard.png)



Humongous（巨大的）：如果某一个对象的大小超过了region区域大小的50%，就被放置到humongous区域当中，humongous是eden、survivor、old generation其中一个。巨型对象默认直接会被分配在老年代，如果一个H区装不下一个巨型对象，那么G1会寻找连续的H分区来存储。为了能找到连续的H区，有时候不得不启动Full GC。



![img](assets/clipboard.png)

不要求堆空间连续。

对于老年代的收集：

![img](assets/clipboard.png)

Full GC不是由G1完成的。



G1提供了两种GC模式，Young GC和Mixed GC，两者都需要STW

Young GC：选定所有年轻代的Region。通过控制年轻代的Region个数，即年轻代内存大小，来控制Young GC的时间开销

Mixed GC：选定所有年轻代里的Region，外加根据global concurrent marking统计得出收集收益高的若干老年代Region。在用户指定的开销目标范围内尽可能选择收益高的老年代Region。



Mixed GC不是Full GC，它只能回收部分老年代的Region，如果Mixed GC实在无法跟上程序分配内存的速度，导致老年代填满无法继续进行Mixed GC，就会使用serial old GC（Full GC）来收集整个GC heap。所以本质上，G1是不提供Full GC的。



global concurrent marking的执行过程类似CMS，但是不同的是，在G1 GC中，它主要是为Mixed GC提供标记服务的，并不是一次GC过程的一个必须环节



global concurrent marking共分为如下四个步骤：



初始标记（initial mark，STW）：它标记了从GC Root开始直接可达的对象

并发标记（Concuurent Marking）:这个阶段从GC Root开始对heap中的对象进行标记，标记线程与应用程序线程并发执行，并且收集各个Region的存活对象信息

重新标记：（Remark，STW）:标记那些在并发标记阶段发生变化的对象，将被回收

清理（Cleanup）:清除空Region（没有存活对象的），加入到free list。



第一阶段initial mark是共用了Young GC的暂停，这是因为他们可以复用root scan操作，所以可以说global concurrent marking是伴随Young GC而发生的，



第四阶段Cleanup只是回收了没有存活对象的Region，所以它并不需要STW。



G1在运行过程中的主要模式

1. YGC（不同于CMS）
2. 并发阶段
3. 混合模式
4. Full GC（一般是G1出现问题时发生）



G1 YGC在Eden充满时触发，在回收之后所有之前属于Eden的区块全部变成空白，即不属于任何一个分区（Eden、Survivor、Old）



Mixed GC由一些参数控制，另外也控制着哪些老年代Region会被选入CSet（收集集合）



G1HeapWastePercent：在global concurrent marking结束之后，我们可以知道old gen regions中有多少空间要被回收，在每次YGC之后和再次发生Mixed GC之前，会检查垃圾占比是否达到此参数，只有达到了，下次才会发生Mixed GC。

G1MixedGCLiveThresholdPercent：old genration region中存活对象的占比，只有在此参数之下，才会被选入CSet。

G1MixedGCCountTarget：一次gloal concurrent marking之后，最多执行Mixed GC的次数

G1OldCSetRegionThresholdPercent：一次Mixed GC中能被选入CSet的最多old generation region数量。



每次GC时，所有新生代都会被扫描，所以无需记录新生代之间的记录引用，只需要记录老年代到新生代之间的引用即可。



如果引用的对象很多，赋值器需要对每个引用做处理，赋值器开销会很大，为了解决赋值器开销这问题，在G1中又引入了另外一个概念，卡表（Card Table）。一个Card Table将一个分区在逻辑上划分为固定大小的连续区域，每个区域称之为卡。卡通常较小，介于128到512字节之间。Card Table通常为字节数组，由Card的索引（即数组小标来标识每个分区的空间地址）



Young GC的阶段：

阶段1：根扫描

- 静态和本地对象被扫描

阶段2：更新RS

- 处理dirty card队列更新RS

阶段3：处理RS

- 检测从年轻代指向老年代的对象

阶段4：对象拷贝

- 拷贝存活的对象到survivor/old区域

阶段5：处理引用队列

- 软引用，，弱引用。虚引用处理



Mixed GC

- 全局并发标记（global concurrent marking）
- 拷贝存活对象（evacuation）



三色标记算法



描述追踪式回收器的一种有效的方法，利用它可以推演回收器的正确性。



我们将对象分成三种类型：

1. 黑色：根对象，或者该对象与它的子对象都被扫描过（对象被标记了，且它的所有的field也被标记完了）
2. 灰色：对象本身被扫描，但还没扫描完该对象中的子对象（它的field还没有被标记或标记完）
3. 白色：未被扫描对象，扫描完成所有对象之后，最终为白色的为不可达对象，即垃圾对象（对象没有被标记到）



遍历了所有可达的对象后，所有可达的对象都变成了黑色，不可达的对象即为白色，需要被清理。



如果在标记过程中，应用程序也在运行，那么对象的指针就有可能改变。这样的话，我们就会遇到一个问题：对象丢失问题



三色标记带来了两个问题，一个是新创建的对象的问题，另一个就是对象丢失的问题



SATB的步骤：

1. 在开始标记的时候生成一个快照图，标记存活对象
2. 在并发标记的时候所有被改变的对象入队（在write barrier里所有旧的引用所指向的对象都变成非白的）
3. 可能存在浮动垃圾，将在下次被收集



新生代使用分区机制的主要是因为便于调整代的大小。



在GC收集的时候，新生代的对象也认为是活的对象，除此之外其他不可达的对象都是认为是垃圾对象。



解决两个问题的方式：

1、如何找到在GC过程中分配的对象呢？每个region记录着两个top-at-mark-start（TAMS）指针，分别为prevTAMS和nextTAMS。在TAMS以上的对象就是新分配的，因而被视为隐式marked。通常这种方式我们就找到了在GC过程中新分配的对象，并把这些对象认为是活的对象。



2、G1通过Write Barrier对引用字段进行赋值做了额外处理。通过Write Barrier就可以了解到那些引用对象发生了什么样的变化。

 

1. 对black新引用了一个white对象，然后又从gray对象中删除了对改white对象的引用，这样会造成了该white对象漏标记
2. 对black新引用了一个white对象，然后从gray对象删了一个引用该white对象的white对象，这样也会造成了该white对象漏标记
3. 对black新引用了一个刚new出来的white对象，没有其他gray对象引用该white对象，这样也会造成了该white对象漏标记



SATB在marking阶段中，对于从gray对象移除的目标引用对象标记为gray，对于black引用的新产生的对象标记为black，由于是在开始时进行的snapshot，因而可能存在浮动垃圾。



误标没什么关系，顶多造成浮动垃圾，在下次gc还是可以回收的，但是漏标的后果是致命的，把本应该存活的对象给回收了，从而影响程序的正确性。



漏标的情况只会发生在白色对象中，且满足以下任意一个条件：

1. 并发标记时，应用线程给一个黑色对象的引用类型字段赋值了该白色对象
2. 并发标记时，应用线程删除所有灰色对象到该白色对象的引用（可能存在黑色对象引用的情况）

解决方案：

1. 利用post-write barrier记录所有新增的引用关系，然后根据这些引用关系为根重新扫描一遍
2. 利用post-write barrier将所有即将被删除的引用关系的旧引用记录下来，最后以这些旧引用为根重新扫描一遍



设置停顿时间：

-XX:MaxGCPauseMillis=x    // 设置启动应用程序暂停时间，一般情况下是100ms-200ms 



停顿时间不是越短越好，设置的时间越短意味着每次收集的CSet就越小，导致垃圾逐步积累变多，最终不得不退化程Serial GC，停顿时间设置的过长那么会导致每次都会产生长时间的停顿，影响了程序对外的响应时间。



CSet里面总是具有所有年轻代里面的Region

CSet = 年轻代所有的Region + 全局并发阶段标记出来的收益高的老年代Region



当Mixed GC赶不上对象产生的速度的时候就退化成Full GC，这一点是需要重点调优的地方。



G1会在Young GC和Mixed GC之间不断地切换，同时定期地做全局并发标记，在实在赶不上对象创建速度的情况下使用Full GC（Serial GC）



G1收集器在运行的时候会自动调整新生代和老年代的大小。通过改变代的大小来调整对象晋升的速度以及晋升年龄，从而达到我们为收集器设置的暂停时间的目标值。



设置了新生代大小相当于放弃了G1为我们做的自动调优，我们只需要设置整个堆内存大小即可。



Evacuation Failure：类似CMS晋升失败，堆空间的垃圾太多导致无法完成Region之间的拷贝，于是不得不退化成Full GC来做一次全局范围内的垃圾收集。



每个Region默认按照512Kb划分成多个Card



RSet：https://www.jianshu.com/p/870abddaba41



JDK网页：https://openjdk.java.net



-verbose:gc -Xms10m -Xmx10m -XX:+UseG1GC   // 使用GC垃圾收集器 -XX:+PrintGCDetails -XX:+PrintGCDateStamps -XX:MaxGCPauseMillis=200m  // 最大停顿时间 

ZGC

使用java实现jvm：https://github.com/fuzhengwei/itstack-demo-jvm